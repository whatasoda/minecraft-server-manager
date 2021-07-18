import defineStore from '../utils/factory';
import common from './common';
import instance from './instance';
import server from './server';

declare global {
  namespace Meteora {
    namespace Store {
      namespace ServerDetail {
        interface State {
          name: string;
        }
      }
    }
  }
}

type State = Meteora.Store.ServerDetail.State;

defineStore<State>()(
  [instance.reduceAction, server.reduceAction, common.reduceState, instance.reduceState, server.reduceState],
  function createActions(context) {
    return {
      instance: instance.createActions(context),
      server: server.createActions(context),
    };
  },
  function createEffects({ instance }) {
    return {
      watchOperations: [
        () => {
          const interval = setInterval(() => {
            instance.refreshOperations();
          }, 4000);
          return () => {
            clearInterval(interval);
          };
        },
        () => [],
      ],
    };
  },
);

export default {};
