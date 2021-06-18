import type { mcsApis } from '../../server/apis/minecraft-server';
import apiClientFactory from '../../shared/apiClientFactory';

const mcs = apiClientFactory(fetch, '/api/mcs');

const mcsService = mcs.many<typeof mcsApis>()({
  list: ['/list', 'GET'],
  create: ['/create', 'POST'],
  start: ['/:instance/start', 'POST'],
  stop: ['/:instance/stop', 'POST'],
  delete: ['/:instance/delete', 'POST'],
  status: ['/:instance/status', 'GET'],
});

export default mcsService;
