import produce, { createDraft } from 'immer';
import { createPromise } from '../../../shared/utils/promise';

export type ActionObject = { type: string };
export type InitialStateInit<State extends {}> = () => State;
export type Dispatcher = (action: ActionObject) => void;

type StateRef<State extends {}> = { current: State };
type Reducer<State extends {}> = (state: State, action: ActionObject) => State;

export type ChildReducer<State extends {}, Action extends ActionObject = ActionObject> = (
  state: State,
  action: Action,
) => State | void;
type ActionFactory<State extends {}, Actions extends {}, Action extends ActionObject = ActionObject> = (
  context: Readonly<ActionContext<State, Action>>,
) => Actions;

interface ActionContext<State extends {}, Action extends ActionObject = ActionObject> {
  getState: () => State;
  dispatch: (action: Action) => Promise<void>;
}

type EffectPayload = void | (() => void);
type EffectArgs<State extends {}> = (state: State) => [effect: () => EffectPayload, dependencies: any[]];

type EffectFuncBody<State extends {}> =
  | EffectFunc<State>
  | [initialCall: EffectFunc<State>, subsequentCalls: EffectFunc<State>];
type EffectFunc<State extends {}> = (state: State) => EffectPayload;
type EffectFactory<State extends {}, Actions extends {}, Effects extends EffectConfigRecord<State>> = (
  actions: Actions,
) => Effects;
type EffectConfig<State extends {}> = [effect: EffectFuncBody<State>, pickDependencies: DependencyPicker<State>];
type DependencyPicker<State extends {}> = (state: State) => any[];
export type EffectConfigRecord<State extends {}> = Record<string, EffectConfig<State>>;
type EffectRecord<State extends {}, Effects extends EffectConfigRecord<State>> = {
  [K in keyof Effects]: EffectArgs<State>;
};

export type CreateStoreCore<
  Props extends {},
  State extends {},
  Actions extends {},
  Effects extends EffectConfigRecord<State>,
> = (props: Props) => StoreCore<State, Actions, Effects>;

interface StoreCore<State extends {}, Actions extends {}, Effects extends EffectConfigRecord<State>> {
  initialState: State;
  reducer: Reducer<State>;
  createStaticItems: (dispatcher: Dispatcher) => {
    actions: Actions;
    effects: EffectRecord<State, Effects>;
  };
}

export type StoreAdapter<
  T,
  Props extends {},
  State extends {},
  Actions extends {},
  Effects extends EffectConfigRecord<State>,
> = (createCore: CreateStoreCore<Props, State, Actions, Effects>) => T;

type StoreAdapterTemplate = <
  Props extends {},
  State extends {},
  Actions extends {},
  Effects extends EffectConfigRecord<State>,
>(
  createCore: CreateStoreCore<Props, State, Actions, Effects>,
) => any;

export const createAdapter = <T extends StoreAdapterTemplate>(adapter: T) => adapter;

export default function defineStore<
  Props extends {},
  State extends {},
  Actions extends {},
  Effects extends EffectConfigRecord<State>,
>(
  initialStateInit: (props: Props) => State,
  reducers: ChildReducer<State, any>[],
  actionFactory: ActionFactory<State, Actions>,
  effectFactory: EffectFactory<State, Actions, Effects>,
) {
  const rootReducer: Reducer<State> = produce((state, action) => {
    for (const reduce of reducers) {
      const next = reduce(state as State, action);
      if (next && next !== state) {
        state = createDraft(next);
      }
    }
    return state;
  });

  const createStoreCore = (props: Props): StoreCore<State, Actions, Effects> => {
    const actionPromises = new WeakMap<ActionObject, { resolve: () => void }>();

    const reducer: Reducer<State> = (state, action) => {
      action = { ...action };
      const next = rootReducer(state, action);
      stateRef.current = next;
      actionPromises.get(action)?.resolve();
      return next;
    };

    const stateRef = {} as StateRef<State>;
    // apply reducers to the initial state
    const initialState = (stateRef.current = reducer(initialStateInit(props), {} as ActionObject));

    const createStaticItems = (dispatcher: Dispatcher) => {
      const actions = createActions(dispatcher);
      const effects = createEffects(actions);
      return { actions, effects };
    };

    const createActions = (dispatcher: Dispatcher) => {
      const actionContext: ActionContext<State> = {
        getState: () => stateRef.current,
        dispatch: (action) => {
          action = { ...action };
          const { promise, resolve } = createPromise<void>();
          actionPromises.set(action, { resolve });
          dispatcher(action);
          return promise;
        },
      };
      return actionFactory(actionContext);
    };

    const createEffects = (actions: Actions) => {
      const configs = effectFactory(actions);
      return Object.entries(configs).reduce<Record<string, EffectArgs<State>>>((acc, [key, config]) => {
        acc[key] = buildEffect(config);
        return acc;
      }, {}) as Record<keyof Effects, EffectArgs<State>>;
    };

    return { initialState, reducer, createStaticItems };
  };

  return function createStore<T>(adapter: StoreAdapter<T, Props, State, Actions, Effects>) {
    return adapter(createStoreCore);
  };
}

export const createActionFactory = <State extends {}, Action extends ActionObject>() => {
  return <Actions extends {}>(factory: ActionFactory<State, Actions, Action>) => {
    return factory;
  };
};

const buildEffect = <State extends {}>(config: EffectConfig<State>): EffectArgs<State> => {
  let [effectBody, pickDependencies] = config;
  if (effectBody instanceof Function) {
    effectBody = [effectBody, effectBody];
  }
  const [initial, subsequent] = effectBody;
  let isInitial = true;
  return (state) => [
    () => {
      if (isInitial) {
        isInitial = false;
        return initial(state);
      } else {
        return subsequent(state);
      }
    },
    pickDependencies(state),
  ];
};
