import type { McsHandlers as McsServerHandlers } from '../../server/apis/mcs';
import type { McsHandlers as McsInstanceHandlers } from '../../mcs';
import createApiClient from '../../shared/apiClientFactory';

const mcsService = createApiClient<McsServerHandlers & Omit<McsInstanceHandlers, '/status'>>({ baseURL: '/api/mcs' })({
  list: {
    path: '/list',
    method: 'get',
  },
  log: {
    path: '/log',
    method: 'get',
  },
  status: {
    path: '/status',
    method: 'get',
  },
  operation: {
    path: '/operation',
    method: 'get',
  },
  create: {
    path: '/create',
    method: 'post',
  },
  start: {
    path: '/start',
    method: 'post',
  },
  stop: {
    path: '/stop',
    method: 'post',
  },
  delete: {
    path: '/delete',
    method: 'post',
  },
  dispatch: {
    path: '/make',
    method: 'post',
  },
});

export default mcsService;
