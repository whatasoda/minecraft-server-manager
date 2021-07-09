import { produce } from 'immer';
import toast from '../components/_overlays/toast';
import mcsService from '../services/mcs';
import createStoreHook from '../utils/createStoreHook';

interface InstanceState {
  instance: Meteora.InstanceInfo;
  serverProcess: Meteora.ServerProcessInfo | null;
  operations: {
    create: Meteora.OperationInfo | null;
    start: Meteora.OperationInfo | null;
    stop: Meteora.OperationInfo | null;
    delete: Meteora.OperationInfo | null;
  };
  flags: {
    canStart: boolean;
    canStop: boolean;
    canDelete: boolean;
    canOpen: boolean;
    canClose: boolean;
    canBackup: boolean;
    canSyncDatapack: boolean;
    canSyncToStorage: boolean;
    canSyncToServer: boolean;
  };
  isLoading: boolean;
  loading: {
    refreshAll: boolean;
    refreshOperations: boolean;
    refreshStatus: boolean;
    create: boolean;
    start: boolean;
    stop: boolean;
    delete: boolean;
    open: boolean;
    close: boolean;
    backup: boolean;
    syncDatapack: boolean;
    syncToStorage: boolean;
    syncToServer: boolean;
  };
}

type LoadingKey = keyof InstanceState['loading'];
type FlagKey = keyof InstanceState['flags'];
type OperationKey = keyof InstanceState['operations'];

createStoreHook(
  produce((state: InstanceState, action: InstanceAction) => {
    switch (action.type) {
      case 'setLoading': {
        const { key, value } = action.payload;
        state.loading[key] = value;
        break;
      }

      case 'refreshStatus': {
        const { instance, serverProcess } = action.payload;
        state.instance = instance;
        state.serverProcess = serverProcess;
        break;
      }

      case 'refreshOperations': {
        const { operations } = action.payload;
        state.operations = operations;
        break;
      }
    }

    state.isLoading = Object.values(state.loading).some(Boolean);
    if (state.isLoading) {
      setAllFlagsOff();
    } else {
      //
    }

    return state;

    function setAllFlagsOff() {
      (Object.keys(state.flags) as FlagKey[]).forEach((key) => {
        state.flags[key] = false;
      });
    }
  }),
  ({ dispatch, getState }) => ({
    async setLoading(key: LoadingKey, value: boolean) {
      const { [key]: curr } = getState().loading;
      if (curr !== value) {
        return dispatch({ type: 'setLoading', payload: { key, value } });
      }
    },

    async refreshAll() {
      await this.setLoading('refreshAll', true);
      await this.refreshOperations();
      await this.refreshStatus();
      await this.setLoading('refreshAll', false);
    },

    async refreshOperations() {
      await this.setLoading('refreshOperations', true);
      const state = getState();
      const operations: InstanceState['operations'] = { ...state.operations };
      const promises = (Object.keys(operations) as OperationKey[]).map(async (key) => {
        const prev = operations[key];
        if (!prev) return;
        const res = await mcsService.operation({ operation: prev.id });
        const curr = res.data?.operation;
        if (!curr) {
          return;
        } else if (curr.status === 'DONE') {
          operations[key] = null;
          toast.success(`Successfully completed '${key}' operation`);
        } else {
          operations[key] = curr;
        }
      });
      await Promise.all(promises);
      await dispatch({ type: 'refreshOperations', payload: { operations } });
      await this.setLoading('refreshOperations', false);
    },

    async refreshStatus() {
      await this.setLoading('refreshStatus', true);
      const state = getState();
      const res = await mcsService.status({ instance: state.instance.name });
      if (res.data) {
        await dispatch({ type: 'refreshStatus', payload: res.data });
      }
      await this.setLoading('refreshStatus', false);
    },
  }),
);

type InstanceAction =
  | {
      type: 'setLoading';
      payload: { key: LoadingKey; value: boolean };
    }
  | {
      type: 'refreshOperations';
      payload: { operations: InstanceState['operations'] };
    }
  | {
      type: 'refreshStatus';
      payload: {
        instance: InstanceState['instance'];
        serverProcess: InstanceState['serverProcess'];
      };
    };
