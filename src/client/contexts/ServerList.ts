import ServerList from '../store/ServerList';
import reactProviderAdapter from '../store/utils/adapters/reactProviderAdapter';

const store = ServerList((createCore) => reactProviderAdapter(createCore));

export const { Provider: ServerListProvider, createConsumer: createServerListConsumer } = store;
