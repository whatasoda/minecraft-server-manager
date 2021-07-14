import React, { createContext, memo, useCallback, useContext, useMemo, useReducer, useRef } from 'react';
import { createSelectorCreator, defaultMemoize } from 'reselect';
import { createContext as createSelectableContext, useContextSelector } from 'use-context-selector';
import shallowequal from 'shallowequal';
import { bindAll } from '../../shared/utils/function';
import { createPromise } from '../../shared/utils/promise';

interface ActionContext<S extends {}, A extends {}> {
  getState: () => S;
  dispatch: (action: A) => Promise<void>;
}

type StoreHook<S extends {}, T extends {}> = (initialState: S | (() => S)) => [S, T];

export default function createStoreHook<S extends {}, A extends {}, T extends {}>(
  reducer: (state: S, action: A) => S,
  createActions: (context: ActionContext<S, A>) => T,
): StoreHook<S, T> {
  const promiseMap = new Map<{}, { resolve: () => void }>();
  return function useStore(initialState: S | (() => S)): [S, T] {
    const reduce = useCallback<typeof reducer>((state, action) => {
      const next = reducer(state, action);
      stateRef.current = next;
      promiseMap.get(action)?.resolve();
      return next;
    }, []);
    const [state, dispatch] = useReducer(reduce, undefined, () => {
      return initialState instanceof Function ? initialState() : initialState;
    });
    const stateRef = useRef(state);
    const actions = useMemo(() => {
      return bindAll(
        createActions({
          getState: () => stateRef.current,
          dispatch: (action) => {
            const { promise, resolve } = createPromise<void>();
            promiseMap.set(action, { resolve });
            promise.then(() => promiseMap.delete(action));
            dispatch(action);
            return promise;
          },
        }),
      );
    }, []);
    return [state, actions];
  };
}

const createSelector = createSelectorCreator(defaultMemoize, (a, b) => shallowequal(a, b));
export const createProvider = <S extends {}, T extends {}, U extends any[]>(
  useStore: StoreHook<S, T>,
  createInitialState: (...args: U) => S,
) => {
  const stateContext = createSelectableContext<S>(null as any);
  const actionContext = createContext<T>(null as any);
  type ProviderProps = [] extends U ? { args?: U } : { args: U };

  const Provider: React.FC<ProviderProps> = memo(
    ({ children, args }) => {
      const [state, actions] = useStore(createInitialState(...(args || ([] as unknown as U))));
      return (
        <stateContext.Provider value={state}>
          <actionContext.Provider value={actions} children={children} />
        </stateContext.Provider>
      );
    },
    () => true,
  );

  const createConsumer = <V extends {}>(selector: (state: S) => V) => {
    const select = createSelector(selector, (value) => value);
    return function useSelectedState() {
      const state = useContextSelector(stateContext, select);
      const actions = useContext(actionContext);
      return [state, actions] as const;
    };
  };

  return { Provider, createConsumer };
};
