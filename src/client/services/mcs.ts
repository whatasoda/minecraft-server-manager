import type { mcsServerApis } from '../../server/apis/mcs';
import type { mcsInstanceApis } from '../../mcs';
import apiClientFactory from '../../shared/apiClientFactory';

const mcs = apiClientFactory(fetch, '/api/mcs');

const mcsService = mcs.many<
  typeof mcsServerApis & {
    '/:instance/make-dispatch/:target': typeof mcsInstanceApis['/make-dispatch/:target'];
  }
>()({
  list: ['/list', 'GET'],
  create: ['/create', 'POST'],
  start: ['/:instance/start', 'POST'],
  stop: ['/:instance/stop', 'POST'],
  delete: ['/:instance/delete', 'POST'],
  status: ['/:instance/status', 'GET'],
  dispatch: ['/:instance/make-dispatch/:target', 'POST'],
});

export default mcsService;
