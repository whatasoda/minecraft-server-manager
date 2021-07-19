import defineStore from '../utils/factory';
import common from './common';
import instance from './instance';
import server from './server';

declare global {
  namespace Meteora {
    namespace Store {
      namespace ServerDetail {
        interface Props {
          name: string;
          instance: Meteora.InstanceInfo;
          creationOperation: Meteora.OperationInfo | null;
        }

        interface State {
          name: string;
        }
      }
    }
  }
}

type State = Meteora.Store.ServerDetail.State;
type Props = Meteora.Store.ServerDetail.Props;

export default defineStore(
  function initialStateInit(props: Props): State {
    return {
      name: props.name,
      common: common.createInitialState(),
      instance: instance.createInitialState(props),
      server: server.createInitialState(),
    };
  },
  [instance.reduceAction, server.reduceAction, common.reduceState, instance.reduceState, server.reduceState],
  function createActions(context) {
    return {
      instance: instance.createActions(context),
      server: server.createActions(context),
    };
  },
  function createEffects({ instance, server }) {
    return {
      initInfo: [
        () => {
          (async () => {
            await instance.refresh();
            await server.refresh();
          })();
        },
        () => [],
      ],

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
