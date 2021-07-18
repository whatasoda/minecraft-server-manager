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

        type OperationKey = typeof OPERATION_KEYS[number];
        type InstanceLoadingKey = 'create' | 'refresh' | OperationKey;

        interface InstanceState {
          info: Meteora.InstanceInfo;
          operations: Record<'create' | OperationKey, Meteora.OperationInfo | null>;
          ready: Record<OperationKey, boolean>;
          loading: Record<InstanceLoadingKey, boolean>;
        }
      }
    }
  }
}

const OPERATION_KEYS = ['start', 'stop', 'delete'] as const;

type State = Meteora.Store.ServerDetail.State;
type LoadingKey = Meteora.Store.ServerDetail.InstanceLoadingKey;
type OperationKey = Meteora.Store.ServerDetail.OperationKey;
type Operations = State['instance']['operations'];

type Action =
  | { type: 'instance.setLoading'; payload: { key: LoadingKey; isLoading: boolean } }
  | { type: 'instance.setInfo'; payload: { info: Meteora.InstanceInfo } }
  | { type: 'instance.setOperations'; payload: { operations: Operations } };

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
  reduceAction,
  reduceState,
  createActions,
};
