import { validateServerConfig } from '../../../shared/models/server-config';
import mcsService, { refreshOperations } from '../../services/mcs';
import { ChildReducer, createActionFactory } from '../utils/factory';

declare global {
  namespace Meteora {
    namespace Store {
      namespace ServerList {
        interface State {
          creation: Creation;
        }

        interface Creation {
          isLoading: boolean;
          isReadyToCreate: boolean;
          config: Meteora.ServerConfig;
          validations: ReturnType<typeof validateServerConfig>;
          creating: CreatingItem | null;
        }

        interface CreatingItem {
          name: string;
          operation: Meteora.OperationInfo;
        }
      }
    }
  }
}

type State = Meteora.Store.ServerList.State;
type Action =
  | { type: 'creation.setLoading'; payload: { isLoading: boolean } }
  | { type: 'creation.updateConfig'; payload: { config: Partial<Meteora.ServerConfig> } }
  | { type: 'creation.setCreatingItem'; payload: { creating: Meteora.Store.ServerList.CreatingItem | null } };

const reduceAction: ChildReducer<State, Action> = (state, action) => {
  switch (action.type) {
    case 'creation.setLoading': {
      const { isLoading: curr } = state.creation;
      const { isLoading: next } = action.payload;
      if (curr !== next) {
        state.creation.isLoading = next;
      }
      break;
    }

    case 'creation.updateConfig': {
      const { config: curr } = state.creation;
      const { config: next } = action.payload;
      curr.name = next.name ?? curr.name;
      curr.machineType = next.machineType ?? curr.machineType;
      curr.diskSizeGb = next.diskSizeGb ?? curr.diskSizeGb;
      curr.javaMemorySizeGb = next.javaMemorySizeGb ?? curr.javaMemorySizeGb;
      break;
    }

    case 'creation.setCreatingItem': {
      const { creating } = action.payload;
      state.creation.creating = creating;
      break;
    }
  }
};

const reduceState: ChildReducer<State> = ({ creation, list }) => {
  const { isAllValid } = (creation.validations = validateServerConfig(creation.config, { servers: list.items }));
  creation.isReadyToCreate = !creation.isLoading && !list.isLoading && isAllValid;
};

const createActions = createActionFactory<State, Action>()(({ dispatch, getState }) => ({
  async updateConfig(config: Partial<Meteora.ServerConfig>) {
    await dispatch({ type: 'creation.updateConfig', payload: { config } });
  },

  async submit() {
    const { creation } = getState();
    if (!creation.isReadyToCreate) return;
    await dispatch({ type: 'creation.setLoading', payload: { isLoading: true } });
    const res = await mcsService.create(creation.config);
    if (res.data) {
      const { name } = creation.config;
      const { operation } = res.data;
      await dispatch({ type: 'creation.setCreatingItem', payload: { creating: { name, operation } } });
    } else {
      await dispatch({ type: 'creation.setLoading', payload: { isLoading: false } });
    }
  },

  async refreshOperation() {
    const { creation } = getState();
    if (!creation.creating) return;
    await refreshOperations({ creating: creation.creating.operation }, async () => {
      await dispatch({ type: 'creation.setCreatingItem', payload: { creating: null } });
      await dispatch({ type: 'creation.setLoading', payload: { isLoading: false } });
    });
  },
}));

export default {
  reduceAction,
  reduceState,
  createActions,
};
