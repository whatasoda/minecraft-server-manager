import ServerDetail from '../store/ServerDetail';
import reactProviderAdapter from '../store/utils/adapters/reactProviderAdapter';

const store = ServerDetail((createCore) => reactProviderAdapter(createCore));

export const { Provider: ServerDetailProvider, createConsumer: createServerDetailConsumer } = store;
