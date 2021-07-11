import { produce } from 'immer';
import toast from '../components/_overlays/toast';
import mcsService, { refreshOperations } from '../services/mcs';
import createStoreHook from '../utils/createStoreHook';

type ComputeOperationKey = 'create' | 'start' | 'stop' | 'delete';
type MakeDispatchKey = 'open' | 'close' | 'backup' | 'syncDatapack' | 'syncToStorage' | 'syncToServer';
type LoadingKey = keyof InstanceState['loading'];
type FlagKey = keyof InstanceState['can'];

interface InstanceState {
  isLoading: boolean;
  instance: Meteora.InstanceInfo;
  serverProcess: Meteora.ServerProcessInfo | null;
  operations: Record<ComputeOperationKey, Meteora.OperationInfo | null>;
  can: Record<Exclude<ComputeOperationKey, 'create'> | MakeDispatchKey, boolean>;
  loading: Record<ComputeOperationKey | MakeDispatchKey, boolean> & {
    refresh: boolean;
  };
}

export default createStoreHook(
  produce((state: InstanceState, action: InstanceAction) => {
    switch (action.type) {
      case 'setLoading': {
        const { key, value } = action.payload;
        state.loading[key] = value;
        break;
      }

      case 'setOperations': {
        const { operations } = action.payload;
        state.operations = operations;
        break;
      }

      case 'setOperation': {
        const { key, operation } = action.payload;
        state.operations[key] = operation;
        break;
      }

      case 'setStatus': {
        const { instance, serverProcess } = action.payload;
        state.instance = instance;
        state.serverProcess = serverProcess;
        break;
      }
    }

    state.isLoading = Object.values(state.loading).some(Boolean);
    if (state.isLoading) {
      (Object.keys(state.can) as FlagKey[]).forEach((key) => {
        state.can[key] = false;
      });
    } else {
      const isServerOpened = !!state.serverProcess;
      state.can.start = state.instance.status === 'STOPPED';
      state.can.stop = state.instance.status === 'RUNNING';
      state.can.delete = state.instance.status === 'STOPPED';
      state.can.open = state.instance.status === 'RUNNING' && !isServerOpened;
      state.can.close = state.instance.status === 'RUNNING' && isServerOpened;
      state.can.backup = state.instance.status === 'RUNNING';
      state.can.syncDatapack = state.instance.status === 'RUNNING';
      state.can.syncToServer = state.instance.status === 'RUNNING' && !isServerOpened;
      state.can.syncToStorage = state.instance.status === 'RUNNING' && !isServerOpened;
    }

    return state;
  }),
  ({ dispatch, getState }) => ({
    async setLoading(key: LoadingKey, value: boolean) {
      const { [key]: curr } = getState().loading;
      if (curr !== value) {
        return dispatch({ type: 'setLoading', payload: { key, value } });
      }
    },

    async refresh() {
      await this.setLoading('refresh', true);
      const state = getState();
      await refreshOperations(state.operations, async (key) => {
        toast.success(`Successfully completed '${key}' operation`);
        await this.setLoading(key, false);
      }).then((operations) => {
        return dispatch({ type: 'setOperations', payload: { operations } });
      });
      const res = await mcsService.status({ instance: state.instance.name });
      if (res.data) {
        const { instance, serverProcess } = res.data;
        await dispatch({ type: 'setStatus', payload: { instance, serverProcess } });
      }
      await this.setLoading('refresh', false);
    },

    async operate(key: Exclude<ComputeOperationKey, 'create'>) {
      const state = getState();
      if (!state.can[key]) return;

      await this.setLoading(key, true);
      const res = await mcsService[key]({ instance: state.instance.name });
      if (res.data) {
        const { operation } = res.data;
        await dispatch({ type: 'setOperation', payload: { key, operation } });
      } else {
        await this.setLoading(key, false);
      }
    },

    async make(key: MakeDispatchKey) {
      const state = getState();
      if (!state.can[key]) return;

      const isConfirmed = await (async function confirm() {
        switch (key) {
          case 'syncDatapack':
          case 'syncToServer':
          case 'syncToStorage':
            // TODO: show dialog to confirm breaking action
            return true;
          default:
            return true;
        }
      })();
      if (!isConfirmed) return;

      await this.setLoading(key, true);
      const common = { instance: state.instance.name };
      const res = await (async function call() {
        switch (key) {
          // TODO: Do we need dedicated endpoints for these make operations?
          case 'open':
            return mcsService.dispatch({ ...common, target: 'start-server', params: {} });
          case 'close':
            return mcsService.dispatch({ ...common, target: 'stop-server', params: {} });
          case 'backup':
            return mcsService.dispatch({ ...common, target: 'backup-server', params: {} });
          case 'syncDatapack':
            return mcsService.dispatch({ ...common, target: 'load-datapacks', params: {} });
          case 'syncToServer':
            return mcsService.dispatch({ ...common, target: 'load-server', params: { mode: 'force' } });
          case 'syncToStorage':
            return mcsService.dispatch({ ...common, target: 'update-server-source', params: {} });
        }
      })();
      res; // TODO: Do we need to show toast here?
      await this.refresh();
      await this.setLoading(key, false);
    },
  }),
);

type InstanceAction =
  | {
      type: 'setLoading';
      payload: { key: LoadingKey; value: boolean };
    }
  | {
      type: 'setOperations';
      payload: { operations: InstanceState['operations'] };
    }
  | {
      type: 'setOperation';
      payload: { key: ComputeOperationKey; operation: Meteora.OperationInfo };
    }
  | {
      type: 'setStatus';
      payload: {
        instance: InstanceState['instance'];
        serverProcess: InstanceState['serverProcess'];
      };
    };
