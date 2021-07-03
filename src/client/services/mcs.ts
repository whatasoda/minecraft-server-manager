import type { McsHandlers as McsServerHandlers } from '../../server/apis/mcs';
import type { McsHandlers as McsInstanceHandlers } from '../../mcs';
import createApiClient from '../../shared/apiClientFactory';

const mcsService = createApiClient<McsServerHandlers & McsInstanceHandlers>({ baseURL: '/api/mcs' })({
  list: ['/list', 'get'],
  create: ['/create', 'post'],
  start: ['/start', 'post'],
  stop: ['/stop', 'post'],
  delete: ['/delete', 'post'],
  status: ['/status', 'get'],
  dispatch: ['/make', 'post'],
});

export default mcsService;
