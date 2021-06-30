import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import type { Request, ParamsDictionary } from 'express-serve-static-core';
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
import { MCS_PORT, MCS_TOKEN_SECRET, METADATA, PROJECT_ID } from '../constants';
import { createMcsAuthHeaders } from '../../shared/mcs-token';
import createRequestHandlers from '../../shared/requestHandlerFactory';
import Compute from '@google-cloud/compute';

const mcs = express().use(withAuth());
export default mcs;

const createCompute = (req: Request) => {
  if (req.authClient) {
    return new Compute({ projectId: PROJECT_ID, authClient: req.authClient });
  } else {
    return null;
  }
};

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
  '/status': [{ instance: string }, Minecraft.MachineInfo];
}

createRequestHandlers<McsHandlers>({
  '/list': async (body, req) => {
    const { pageToken } = body;
    const compute = createCompute(req)!;
    const data = await listInstances(compute, pageToken);
    return data;
  },
  '/create': async (body, req) => {
    const { name, machineType, diskSizeGb, javaMemorySizeGb } = body;
    const compute = createCompute(req)!;
    const data = await createInstance(compute, name, { machineType, diskSizeGb, javaMemorySizeGb });
    return data;
  },
  '/start': async (body, req) => {
    const { instance } = body;
    const compute = createCompute(req)!;
    const data = await startInstance(compute, instance);
    return data;
  },
  '/stop': async (body, req) => {
    const { instance } = body;
    const compute = createCompute(req)!;
    const data = await stopInstance(compute, instance);
    return data;
  },
  '/delete': async (body, req) => {
    const { instance } = body;
    const compute = createCompute(req)!;
    const data = await deleteInstance(compute, instance);
    return data;
  },
  '/status': async (body, req) => {
    const { instance } = body;
    const compute = createCompute(req)!;
    const data = await getInstanceInfo(compute, instance);
    // try {
    //   const origin = await resolveMcsOrigin(instance, () => Promise.resolve(data));
    // } catch (e) {}
    return data;
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

const resolveMcsOrigin = async (instance: string, getInfo: () => Promise<Minecraft.MachineInfo>) => {
  const hostname = `${instance}.${METADATA.ZONE}.c.${PROJECT_ID}.internal`;
  if (process.env.NODE_ENV === 'production') {
    return `http://${hostname}:${MCS_PORT}`;
  } else {
    const { globalIP } = await getInfo();
    return globalIP ? `http://${globalIP}:${MCS_PORT}` : null;
  }
};

interface McsProxyConfig {
  path: string;
  pathRewrite: (params: ParamsDictionary) => string;
}

const PROXIES: McsProxyConfig[] = [
  {
    path: '/log',
    pathRewrite: () => `/log`,
  },
  {
    path: '/status',
    pathRewrite: () => `/status`,
  },
  {
    path: '/make',
    pathRewrite: () => `/make`,
  },
];

PROXIES.forEach(({ path, pathRewrite }) => {
  mcs.use(
    path,
    createProxyMiddleware({
      pathRewrite: (_, req) => {
        return pathRewrite(req.params);
      },
      router: async (req) => {
        const { instance } = req.params.instance || req.body.instance;
        const origin = await resolveMcsOrigin(instance, () => {
          const compute = createCompute(req)!;
          return getInstanceInfo(compute, instance!);
        });
        if (!origin) {
          // eslint-disable-next-line no-console
          console.log('Target instance inactive: skipped proxy');
          throw {};
        }
        return origin;
      },
      onProxyReq: (proxyReq, req) => {
        const { instance } = req.params;
        const hostname = `${instance}.${METADATA.ZONE}.c.${PROJECT_ID}.internal`;
        const authHeaders = createMcsAuthHeaders(hostname, MCS_TOKEN_SECRET);

        Object.entries(authHeaders).forEach(([name, value]) => {
          proxyReq.setHeader(name, value);
        });
      },
    }),
    (_, res) => {
      // TODO: return json response, perhaps status code should be changed
      res.status(404).send();
    },
  );
});
