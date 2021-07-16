import defineStore from '../utils/factory';
import creation from './creation';
import list from './list';

declare global {
  namespace Meteora {
    namespace Store {
      namespace ServerList {
        interface State {}
      }
    }
  }
}

type State = Meteora.Store.ServerList.State;

export default defineStore<State>()(
  [list.reduceAction, creation.reduceAction, list.reduceState, creation.reduceState],
  function createActions(context) {
    return {
      list: list.createActions(context),
      creation: creation.createActions(context),
    };
  },
  function createEffects({ creation, list }) {
    return {
      initList: [() => void list.refresh(), () => []],

      watchCreationOperation: [
        () => {
          let isRefreshing = false;
          const interval = setInterval(async () => {
            if (isRefreshing) return;
            isRefreshing = true;
            await creation.refreshOperation();
            isRefreshing = false;
          }, 3000);
          return () => {
            clearInterval(interval);
          };
        },
        () => [],
      ],
    };
  },
);
