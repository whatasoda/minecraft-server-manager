import mcsService from '../../services/mcs';
import { ChildReducer, createActionFactory } from '../utils/factory';

declare global {
  namespace Meteora {
    namespace Store {
      namespace ServerList {
        interface State {
          list: List;
        }

        interface List {
          isLoading: boolean;
          items: ListItem[];
        }

        interface ListItem {
          name: string;
          instance: Meteora.InstanceInfo;
          creationOperation: Meteora.OperationInfo | null;
        }
      }
    }
  }
}

type State = Meteora.Store.ServerList.State;
type Action =
  | { type: 'list.setLoading'; payload: { isLoading: boolean } }
  | { type: 'list.setInstances'; payload: { instances: Meteora.InstanceInfo[] } };

const createInitialState = (): State['list'] => ({
  isLoading: false,
  items: [],
});

const reduceAction: ChildReducer<State, Action> = (state, action) => {
  switch (action.type) {
    case 'list.setLoading': {
      const { isLoading: curr } = state.list;
      const { isLoading: next } = action.payload;
      if (curr !== next) {
        state.list.isLoading = next;
      }
      break;
    }

    case 'list.setInstances': {
      const { instances } = action.payload;
      const { creating } = state.creation;
      state.list.items = instances.map((instance) => ({
        name: instance.name,
        instance,
        creationOperation: creating?.name !== instance.name ? null : creating.operation,
      }));
      break;
    }
  }
};

const reduceState: ChildReducer<State> = () => {};

const createActions = createActionFactory<State, Action>()(({ dispatch, getState }) => ({
  async refresh() {
    const { list } = getState();
    if (list.isLoading) return;
    await dispatch({ type: 'list.setLoading', payload: { isLoading: true } });
    const res = await mcsService.list({});
    if (res.data) {
      const { instances } = res.data;
      await dispatch({ type: 'list.setInstances', payload: { instances } });
    }
    await dispatch({ type: 'list.setLoading', payload: { isLoading: false } });
  },
}));

export default {
  createInitialState,
  reduceAction,
  reduceState,
  createActions,
};
