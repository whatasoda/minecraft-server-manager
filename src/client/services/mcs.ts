import type { McsHandlers as McsServerHandlers } from '../../server/apis/mcs';
import type { McsHandlers as McsInstanceHandlers } from '../../mcs';
import createApiClient from '../../shared/apiClientFactory';

const mcsService = createApiClient<McsServerHandlers & Omit<McsInstanceHandlers, '/status'>>({ baseURL: '/api/mcs' })({
  list: ['/list', 'get'],
  create: ['/create', 'post'],
  start: ['/start', 'post'],
  stop: ['/stop', 'post'],
  delete: ['/delete', 'post'],
  log: ['/log', 'get'],
  status: ['/status', 'get'],
  dispatch: ['/make', 'post'],
});

export default mcsService;
