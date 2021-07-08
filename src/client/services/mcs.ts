import type { McsHandlers as McsServerHandlers } from '../../server/apis/mcs';
import type { McsHandlers as McsInstanceHandlers } from '../../mcs';
import createApiClient from '../../shared/apiClientFactory';
import toast from '../components/_overlays/toast';

const baseURL = '/api/mcs';

const failGet = (path: string, message: string) => {
  return `Failed to get '${baseURL}${path}' due to: '${message}'`;
};

const failPost = (path: string, message: string) => {
  return `Failed to call '${baseURL}${path}' due to: '${message}'`;
};

const mcsService = createApiClient<McsServerHandlers & Omit<McsInstanceHandlers, '/status'>>({ baseURL })({
  list: {
    path: '/list',
    method: 'get',
    onResponse: ({ error }) => {
      error?.message && toast.danger(failGet('/list', error?.message));
    },
  },
  log: {
    path: '/log',
    method: 'get',
    onResponse: ({ error }) => {
      error?.message && toast.danger(failGet('/log', error?.message));
    },
  },
  status: {
    path: '/status',
    method: 'get',
    onResponse: ({ error }) => {
      error?.message && toast.danger(failGet('/status', error?.message));
    },
  },
  operation: {
    path: '/operation',
    method: 'get',
    onResponse: ({ error }) => {
      error?.message && toast.danger(failGet('/operation', error?.message));
    },
  },
  create: {
    path: '/create',
    method: 'post',
    onResponse: ({ error }) => {
      error?.message && toast.danger(failPost('/create', error?.message));
    },
  },
  start: {
    path: '/start',
    method: 'post',
    onResponse: ({ error }) => {
      error?.message && toast.danger(failPost('/start', error?.message));
    },
  },
  stop: {
    path: '/stop',
    method: 'post',
    onResponse: ({ error }) => {
      error?.message && toast.danger(failPost('/stop', error?.message));
    },
  },
  delete: {
    path: '/delete',
    method: 'post',
    onResponse: ({ error }) => {
      error?.message && toast.danger(failPost('/delete', error?.message));
    },
  },
  dispatch: {
    path: '/make',
    method: 'post',
    onResponse: ({ error }) => {
      error?.message && toast.danger(failPost('/make', error?.message));
    },
  },
});

export default mcsService;
