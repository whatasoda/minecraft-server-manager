import { produce } from 'immer';
import validateServerConfig from '../../shared/validations/serverConfig';
import toast from '../components/_overlays/toast';
import mcsService, { refreshOperations } from '../services/mcs';
import createStoreHook from '../utils/createStoreHook';

type OperationKey = 'create';
type LoadingKey = keyof ServerListState['loading'];

interface ServerListState {
  create: {
    config: Meteora.ServerConfig;
    validations: ReturnType<typeof validateServerConfig>;
  };
  servers: {
    name: string;
    createOperation: Meteora.OperationInfo | null;
  }[];
  operations: Record<OperationKey, Meteora.OperationInfo | null>;
  can: Record<OperationKey, boolean>;
  loading: {
    refresh: boolean;
    create: boolean;
  };
}

export default createStoreHook(
  produce((state: ServerListState, action: InstanceListAction) => {
    switch (action.type) {
      case 'setLoading': {
        const { key, value } = action.payload;
        state.loading[key] = value;
        break;
      }

      case 'setServers': {
        const { servers } = action.payload;
        state.servers = servers;
        break;
      }

      case 'updateCreateConfig': {
        const { serverConfig: next } = action.payload;
        const { config: curr } = state.create;
        curr.name = next.name || curr.name;
        curr.machineType = next.machineType || curr.machineType;
        curr.diskSizeGb = next.diskSizeGb || curr.diskSizeGb;
        curr.javaMemorySizeGb = next.javaMemorySizeGb || curr.javaMemorySizeGb;
        break;
      }

      case 'create': {
        const { name, operation: createOperation } = action.payload;
        state.servers = [{ name, createOperation }, ...state.servers];
        break;
      }
    }

    const isLoading = Object.values(state.loading).some(Boolean);
    state.create.validations = validateServerConfig(state.create.config, { servers: state.servers });
    state.can.create = !isLoading && state.create.validations.isAllValid;
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
      const res = await mcsService.list({});
      if (res.data) {
        const { instances } = res.data;
        const servers = instances.map(({ name }) => ({ name, createOperation: null }));
        await dispatch({ type: 'setServers', payload: { servers } });
      }
      await this.setLoading('refresh', false);
    },

    async updateCreateConfig(serverConfig: Partial<Meteora.ServerConfig>) {
      await dispatch({ type: 'updateCreateConfig', payload: { serverConfig } });
    },

    async create() {
      const state = getState();
      if (!state.can.create) return;
      await this.setLoading('create', true);
    },
  }),
);

type InstanceListAction =
  | {
      type: 'setLoading';
      payload: { key: keyof ServerListState['loading']; value: boolean };
    }
  | {
      type: 'setServers';
      payload: { servers: ServerListState['servers'] };
    }
  | {
      type: 'setOperations';
      payload: { operations: ServerListState['operations'] };
    }
  | {
      type: 'updateCreateConfig';
      payload: { serverConfig: Partial<Meteora.ServerConfig> };
    }
  | {
      type: 'create';
      payload: {
        name: string;
        operation: Meteora.OperationInfo;
      };
    };
