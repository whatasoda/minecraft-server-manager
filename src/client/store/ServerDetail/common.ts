import { ChildReducer } from '../utils/factory';

declare global {
  namespace Meteora {
    namespace Store {
      namespace ServerDetail {
        interface State {
          common: CommonState;
        }

        interface CommonState {
          isLoading: boolean;
        }
      }
    }
  }
}

type State = Meteora.Store.ServerDetail.State;

const createInitialState = (): State['common'] => ({
  isLoading: false,
});

const reduceState: ChildReducer<State> = ({ instance, common }) => {
  const loading = { ...instance.loading };
  common.isLoading = Object.values(loading).some(Boolean);
};

export default {
  createInitialState,
  reduceState,
};
