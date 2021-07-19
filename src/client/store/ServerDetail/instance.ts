import { initRecord } from '../../../shared/utils/record';
import toast from '../../components/_overlays/toast';
import mcsService, { refreshOperations } from '../../services/mcs';
import { ChildReducer, createActionFactory } from '../utils/factory';

declare global {
  namespace Meteora {
    namespace Store {
      namespace ServerDetail {
        interface State {
          instance: InstanceState;
        }

        type InstanceOperationKey = typeof OPERATION_KEYS[number];
        type InstanceLoadingKey = 'create' | 'refresh' | InstanceOperationKey;

        interface InstanceState {
          info: Meteora.InstanceInfo;
          operations: Record<'create' | InstanceOperationKey, Meteora.OperationInfo | null>;
          ready: Record<InstanceOperationKey, boolean>;
          loading: Record<InstanceLoadingKey, boolean>;
        }
      }
    }
  }
}

const OPERATION_KEYS = ['start', 'stop', 'delete'] as const;

type State = Meteora.Store.ServerDetail.State;
type Props = Meteora.Store.ServerDetail.Props;
type LoadingKey = Meteora.Store.ServerDetail.InstanceLoadingKey;
type OperationKey = Meteora.Store.ServerDetail.InstanceOperationKey;
type Operations = State['instance']['operations'];

type Action =
  | { type: 'instance.setLoading'; payload: { key: LoadingKey; isLoading: boolean } }
  | { type: 'instance.setInfo'; payload: { info: Meteora.InstanceInfo } }
  | { type: 'instance.setOperations'; payload: { operations: Operations } };

const createInitialState = ({ instance, creationOperation }: Props): State['instance'] => ({
  info: instance,
  operations: {
    ...initRecord(null, OPERATION_KEYS),
    create: creationOperation,
  },
  ready: initRecord(false, OPERATION_KEYS),
  loading: initRecord(false, ['create', 'refresh', ...OPERATION_KEYS]),
});

const reduceAction: ChildReducer<State, Action> = (state, action) => {
  switch (action.type) {
    case 'instance.setLoading': {
      const { loading } = state.instance;
      const { key, isLoading: next } = action.payload;
      const { [key]: curr } = loading;
      if (curr !== next) {
        loading[key] = next;
      }
      break;
    }

    case 'instance.setInfo': {
      const { info } = action.payload;
      state.instance.info = info;
      break;
    }

    case 'instance.setOperations': {
      const { operations } = action.payload;
      state.instance.operations = operations;
      break;
    }
  }
};

const reduceState: ChildReducer<State> = ({ instance, common }) => {
  if (common.isLoading) {
    OPERATION_KEYS.forEach((key) => {
      instance.ready[key] = false;
    });
  } else {
    const { status } = instance.info;
    instance.ready.start = status === 'STOPPED' || status === 'TERMINATED';
    instance.ready.stop = status === 'RUNNING';
    instance.ready.delete = status === 'STOPPED' || status === 'TERMINATED';
  }
};

const createActions = createActionFactory<State, Action>()(({ dispatch, getState }) => ({
  async refresh() {
    const { instance } = getState();
    if (instance.loading.refresh) return;
    await dispatch({ type: 'instance.setLoading', payload: { key: 'refresh', isLoading: true } });
    const res = await mcsService.status({ instance: instance.info.name });
    if (res.data) {
      const { instance: info } = res.data;
      await dispatch({ type: 'instance.setInfo', payload: { info } });
    }
    await dispatch({ type: 'instance.setLoading', payload: { key: 'refresh', isLoading: false } });
  },

  async operate(key: OperationKey) {
    const { instance } = getState();
    if (!instance.ready[key]) return;
    await dispatch({ type: 'instance.setLoading', payload: { key, isLoading: true } });
    const res = await mcsService[key]({ instance: instance.info.name });
    if (res.data) {
      const { operation } = res.data;
      const operations = {
        ...instance.operations,
        [key]: operation,
      };
      await dispatch({ type: 'instance.setOperations', payload: { operations } });
    } else {
      await dispatch({ type: 'instance.setLoading', payload: { key, isLoading: false } });
    }
  },

  async refreshOperations() {
    const { instance } = getState();
    if (!Object.values(instance.operations).some(Boolean)) return;
    let isSomethingDone = false;
    const operations = await refreshOperations(instance.operations, async (key) => {
      isSomethingDone = true;
      toast.success(`Successfully completed '${key}' operation`);
      await dispatch({ type: 'instance.setLoading', payload: { key, isLoading: false } });
    });
    if (isSomethingDone) {
      await this.refresh();
    }
    await dispatch({ type: 'instance.setOperations', payload: { operations } });
  },
}));

export default {
  createInitialState,
  reduceAction,
  reduceState,
  createActions,
};
