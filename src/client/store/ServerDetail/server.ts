import mcsService from '../../services/mcs';
import { ChildReducer, createActionFactory } from '../utils/factory';

declare global {
  namespace Meteora {
    namespace Store {
      namespace ServerDetail {
        interface State {
          server: ServerState;
        }

        type ServerActionKey = typeof SERVER_ACTION_KEYS[number];
        type ServerLoadingKey = 'refresh' | ServerActionKey;

        interface ServerState {
          info: Meteora.ServerProcessInfo | null;
          ready: Record<ServerLoadingKey, boolean>;
          loading: Record<ServerLoadingKey, boolean>;
        }
      }
    }
  }
}

const SERVER_ACTION_KEYS = ['open', 'close', 'backup', 'syncDatapack', 'syncToStorage', 'syncToServer'] as const;

type State = Meteora.Store.ServerDetail.State;
type ActionKey = Meteora.Store.ServerDetail.ServerActionKey;
type LoadingKey = Meteora.Store.ServerDetail.ServerLoadingKey;

type Action =
  | { type: 'server.setLoading'; payload: { key: LoadingKey; isLoading: boolean } }
  | { type: 'server.setInfo'; payload: { info: Meteora.ServerProcessInfo | null } };

const reduceAction: ChildReducer<State, Action> = (state, action) => {
  switch (action.type) {
    case 'server.setLoading': {
      const { loading } = state.server;
      const { key, isLoading: next } = action.payload;
      const { [key]: curr } = loading;
      if (curr !== next) {
        loading[key] = next;
      }
      break;
    }

    case 'server.setInfo': {
      const { info } = action.payload;
      state.server.info = info;
      break;
    }
  }
};

const reduceState: ChildReducer<State> = ({ server, instance, common }) => {
  const isServerRunning = instance.info.status === 'RUNNING';
  const isServerOpened = !!server.info;
  server.ready.refresh = isServerRunning && !server.loading.refresh;
  if (common.isLoading || !isServerRunning) {
    SERVER_ACTION_KEYS.forEach((key) => {
      server.ready[key] = false;
    });
  } else {
    server.ready.open = !isServerOpened;
    server.ready.close = isServerOpened;
    server.ready.backup = true;
    server.ready.syncDatapack = true;
    server.ready.syncToServer = !isServerOpened;
    server.ready.syncToStorage = !isServerOpened;
  }
};

const createActions = createActionFactory<State, Action>()(({ dispatch, getState }) => ({
  async refresh() {
    const { server, instance } = getState();
    if (!server.ready.refresh) return;
    await dispatch({ type: 'server.setLoading', payload: { key: 'refresh', isLoading: true } });
    const res = await mcsService.serverStatus({ instance: instance.info.name });
    if (res.data) {
      const { server: info } = res.data;
      await dispatch({ type: 'server.setInfo', payload: { info } });
    }
    await dispatch({ type: 'server.setLoading', payload: { key: 'refresh', isLoading: false } });
  },

  async makeAction(key: ActionKey) {
    const { instance, server } = getState();
    if (!server.ready[key]) return;

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

    await dispatch({ type: 'server.setLoading', payload: { key, isLoading: true } });
    const general = { instance: instance.info.name };
    const res = await (async function call() {
      switch (key) {
        // TODO: Do we need dedicated endpoints for these make operations?
        case 'open':
          return mcsService.dispatch({ ...general, target: 'start-server', params: {} });
        case 'close':
          return mcsService.dispatch({ ...general, target: 'stop-server', params: {} });
        case 'backup':
          return mcsService.dispatch({ ...general, target: 'backup-server', params: {} });
        case 'syncDatapack':
          return mcsService.dispatch({ ...general, target: 'load-datapacks', params: {} });
        case 'syncToServer':
          return mcsService.dispatch({ ...general, target: 'load-server', params: { mode: 'force' } });
        case 'syncToStorage':
          return mcsService.dispatch({ ...general, target: 'update-server-source', params: {} });
      }
    })();
    res;
    await this.refresh();
    await dispatch({ type: 'server.setLoading', payload: { key, isLoading: false } });
  },
}));

export default {
  reduceAction,
  reduceState,
  createActions,
};
