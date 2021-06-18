import { apis } from '../../server/apis/minecraft-server';
import apiClientFactory from '../../shared/apiClientFactory';

const mcs = apiClientFactory(fetch, '/api/mcs');

const mcsService = {
  list: mcs<typeof apis['/list']['definition']>('/list', 'GET'),
  create: mcs<typeof apis['/create']['definition']>('/create', 'POST'),
  start: mcs<typeof apis['/:instance/start']['definition']>('/:instance/start', 'POST'),
  stop: mcs<typeof apis['/:instance/stop']['definition']>('/:instance/stop', 'POST'),
  delete: mcs<typeof apis['/:instance/delete']['definition']>('/:instance/delete', 'POST'),
  status: mcs<typeof apis['/:instance/status']['definition']>('/:instance/status', 'GET'),
};

export default mcsService;
