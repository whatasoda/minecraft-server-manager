import express from 'express';
import { withAuth } from './auth';
import {
  createInstance,
  deleteInstance,
  getInstanceInfo,
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
      instances: Minecraft.MachineInfo[];
      nextQuery: string | undefined;
    },
  ];
  '/create': [
    {
      name: string;
      machineType: string;
      diskSizeGb: number;
      javaMemorySizeGb: number;
    },
    {},
  ];
  '/start': [{ instance: string }, {}];
  '/stop': [{ instance: string }, {}];
  '/delete': [{ instance: string }, {}];
  '/status': [
    { instance: string },
    {
      machine: Minecraft.MachineInfo;
      application: Minecraft.ApplicationStatus | null;
    },
  ];
}

createRequestHandlers<McsHandlers>({
  '/list': async ({ body, req }) => {
    const { pageToken } = body;
    const data = await listInstances(req, pageToken);
    return data;
  },
  '/create': async ({ body, req }) => {
    const { name, machineType, diskSizeGb, javaMemorySizeGb } = body;
    const data = await createInstance(req, name, { machineType, diskSizeGb, javaMemorySizeGb });
    return data;
  },
  '/start': async ({ body, req }) => {
    const { instance } = body;
    const data = await startInstance(req, instance);
    return data;
  },
  '/stop': async ({ body, req }) => {
    const { instance } = body;
    const data = await stopInstance(req, instance);
    return data;
  },
  '/delete': async ({ body, req }) => {
    const { instance } = body;
    const data = await deleteInstance(req, instance);
    return data;
  },
  '/status': async ({ body, req }) => {
    const { instance } = body;
    const machine = await getInstanceInfo(req, instance);
    const baseUrl = await resolveMcsBaseUrl(instance, () => Promise.resolve(machine)).catch(() => null);
    if (baseUrl) {
      const appStatus = await McsApiClient.status({ instance }, baseUrl);
      if (appStatus.error === null) {
        return { machine, application: appStatus.data };
      }
    }
    return { machine, application: null };
  },
}).forEach((endpoint) => {
  switch (endpoint.path) {
    case '/create':
    case '/start':
    case '/stop':
    case '/delete':
      mcs.post(endpoint.path, endpoint.factory(defaultAdapter));
      break;
    case '/list':
    case '/status':
      mcs.get(endpoint.path, endpoint.factory(defaultAdapter));
      break;
    default:
      endpoint; // Should be `never` here
  }
});

interface McsProxyConfig {
  path: string;
}

const PROXIES: McsProxyConfig[] = [
  {
    path: '/log',
  },
  {
    path: '/make',
  },
];

PROXIES.forEach(({ path }) => {
  mcs.use(path, createMcsProxy(path), (_, res) => {
    // TODO: return json response, perhaps status code should be changed
    res.status(404).send();
  });
});
