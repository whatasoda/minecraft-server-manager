import type { McsHandlers as McsServerHandlers } from '../../server/apis/mcs';
import type { McsHandlers as McsInstanceHandlers } from '../../mcs';
import createApiClient from '../utils/apiClientFactory';

const mcsService = createApiClient<McsServerHandlers & McsInstanceHandlers>('/api/mcs')({
  list: ['/list', 'get'],
  create: ['/create', 'post'],
  start: ['/start', 'post'],
  stop: ['/stop', 'post'],
  delete: ['/delete', 'post'],
  status: ['/status', 'get'],
  dispatch: ['/make-dispatch', 'post'],
});

export default mcsService;
