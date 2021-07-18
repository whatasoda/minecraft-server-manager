import express from 'express';
import { withAuth } from './auth';
import {
  createInstance,
  deleteInstance,
  getInstanceInfo,
  getOperationInfo,
  listInstances,
  startInstance,
  stopInstance,
} from '../services/compute';
import { defaultAdapter } from '../../shared/defaultRequestAdapter';
import createRequestHandlers from '../../shared/requestHandlerFactory';
import { createMcsProxy, McsApiClient, resolveMcsBaseUrl } from './utils';
import { initComputeContext } from '../service-adapters/compute';

const mcs = express().use(withAuth(), (req, _, next) => {
  initComputeContext(req);
  next();
});
export default mcs;

export interface McsHandlers {
  '/list': [
    {
      pageToken?: string;
    },
    {
      instances: Meteora.InstanceInfo[];
      nextPageToken: string | undefined;
    },
  ];
  '/create': [
    {
      name: string;
      machineType: string;
      diskSizeGb: number;
      javaMemorySizeGb: number;
    },
    { operation: Meteora.OperationInfo },
  ];
  '/start': [{ instance: string }, { operation: Meteora.OperationInfo }];
  '/stop': [{ instance: string }, { operation: Meteora.OperationInfo }];
  '/delete': [{ instance: string }, { operation: Meteora.OperationInfo }];
  '/status': [
    { instance: string },
    {
      instance: Meteora.InstanceInfo;
      serverProcess: Meteora.ServerProcessInfo | null;
    },
  ];
  '/operation': [{ operation: string }, { operation: Meteora.OperationInfo }];
}

createRequestHandlers<McsHandlers>({
  '/list': async ({ body, req }) => {
    const { pageToken } = body;
    const data = await listInstances(req, pageToken);
    return data;
  },
  '/status': async ({ body, req }) => {
    const instance = await getInstanceInfo(req, body.instance);
    const baseUrl = await resolveMcsBaseUrl(body.instance, () => Promise.resolve(instance)).catch(() => null);
    if (baseUrl) {
      const appStatus = await McsApiClient.status(body, baseUrl);
      if (appStatus.error === null) {
        return { instance, serverProcess: appStatus.data.server };
      }
    }
    return { instance, serverProcess: null };
  },
  '/operation': async ({ body, req }) => {
    const operation = await getOperationInfo(req, body.operation);
    return { operation };
  },
  '/create': async ({ body, req }) => {
    const { name, machineType, diskSizeGb, javaMemorySizeGb } = body;
    const operation = await createInstance(req, { name, machineType, diskSizeGb, javaMemorySizeGb });
    return { operation };
  },
  '/start': async ({ body, req }) => {
    const { instance } = body;
    const operation = await startInstance(req, instance);
    return { operation };
  },
  '/stop': async ({ body, req }) => {
    const { instance } = body;
    const operation = await stopInstance(req, instance);
    return { operation };
  },
  '/delete': async ({ body, req }) => {
    const { instance } = body;
    const operation = await deleteInstance(req, instance);
    return { operation };
  },
}).forEach((endpoint) => {
  switch (endpoint.path) {
    case '/list':
    case '/status':
    case '/operation':
      mcs.get(endpoint.path, endpoint.factory(defaultAdapter));
      break;
    case '/create':
    case '/start':
    case '/stop':
    case '/delete':
      mcs.post(endpoint.path, endpoint.factory(defaultAdapter));
      break;
    default:
      endpoint; // Should be `never` here
  }
});

interface McsProxyConfig {
  path: string;
}

const PROXIES: McsProxyConfig[] = [{ path: '/log' }, { path: '/make' }, { path: '/server-status' }];

PROXIES.forEach(({ path }) => {
  mcs.use(path, createMcsProxy(path), (_, res) => {
    // TODO: return json response, perhaps status code should be changed
    res.status(404).send();
  });
});
