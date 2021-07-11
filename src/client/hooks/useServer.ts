import { produce } from 'immer';
import { initRecord } from '../../shared/utils/record';
import toast from '../components/_overlays/toast';
import mcsService, { refreshOperations } from '../services/mcs';
import createStoreHook from '../utils/createStoreHook';

const OPERATION_KEYS = ['start', 'stop', 'delete'] as const;
const MAKE_DISPATCH_KEYS = ['open', 'close', 'backup', 'syncDatapack', 'syncToStorage', 'syncToServer'] as const;
const READY_KIND_KEY = [...OPERATION_KEYS, ...MAKE_DISPATCH_KEYS] as const;

type OperationKey = typeof OPERATION_KEYS[number];
type MakeDispatchKey = typeof MAKE_DISPATCH_KEYS[number];
type ReadyKindKey = typeof READY_KIND_KEY[number];
type LoadingKey = keyof ServerState['loading'];

interface ServerState {
  name: string;
  isLoading: boolean;
  instance: Meteora.InstanceInfo | null;
  serverProcess: Meteora.ServerProcessInfo | null;
  operations: Record<'create' | OperationKey, Meteora.OperationInfo | null>;
  ready: Record<ReadyKindKey, boolean>;
  loading: Record<OperationKey | MakeDispatchKey, boolean> & {
    create: boolean;
    refresh: boolean;
  };
}

export const createInitialState = (name: string, createOperation: Meteora.OperationInfo | null): ServerState => ({
  name,
  isLoading: false,
  instance: null,
  serverProcess: null,
  operations: {
    ...initRecord(null, OPERATION_KEYS),
    create: createOperation,
  },
  ready: initRecord(false, READY_KIND_KEY),
  loading: initRecord(false, [...OPERATION_KEYS, ...MAKE_DISPATCH_KEYS, 'create', 'refresh']),
});

export default createStoreHook(
  produce((state: ServerState, action: InstanceAction) => {
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

    const { instance, serverProcess } = state;
    // const isInstanceExisted = !!instance;
    const isServerOpened = !!instance && !!serverProcess;
    state.isLoading = Object.values(state.loading).some(Boolean);
    if (state.isLoading || !instance) {
      (Object.keys(state.ready) as ReadyKindKey[]).forEach((key) => {
        state.ready[key] = false;
      });
    } else {
      state.ready.start = instance.status === 'STOPPED';
      state.ready.stop = instance.status === 'RUNNING';
      state.ready.delete = instance.status === 'STOPPED';
      state.ready.open = instance.status === 'RUNNING' && !isServerOpened;
      state.ready.close = instance.status === 'RUNNING' && isServerOpened;
      state.ready.backup = instance.status === 'RUNNING';
      state.ready.syncDatapack = instance.status === 'RUNNING';
      state.ready.syncToServer = instance.status === 'RUNNING' && !isServerOpened;
      state.ready.syncToStorage = instance.status === 'RUNNING' && !isServerOpened;
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
      const res = await mcsService.status({ instance: state.name });
      if (res.data) {
        const { instance, serverProcess } = res.data;
        await dispatch({ type: 'setStatus', payload: { instance, serverProcess } });
      }
      await this.setLoading('refresh', false);
    },

    async operate(key: Exclude<OperationKey, 'create'>) {
      const state = getState();
      if (!state.ready[key]) return;

      await this.setLoading(key, true);
      const res = await mcsService[key]({ instance: state.name });
      if (res.data) {
        const { operation } = res.data;
        await dispatch({ type: 'setOperation', payload: { key, operation } });
      } else {
        await this.setLoading(key, false);
      }
    },

    async make(key: MakeDispatchKey) {
      const state = getState();
      if (!state.ready[key]) return;

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
      const common = { instance: state.name };
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
      payload: { operations: ServerState['operations'] };
    }
  | {
      type: 'setOperation';
      payload: { key: OperationKey; operation: Meteora.OperationInfo };
    }
  | {
      type: 'setStatus';
      payload: {
        instance: ServerState['instance'];
        serverProcess: ServerState['serverProcess'];
      };
    };
