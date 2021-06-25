import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import type { ParamsDictionary } from 'express-serve-static-core';
import { withAuth } from './auth';
import {
  createInstance,
  deleteInstance,
  getInstanceInfo,
  listInstances,
  startInstance,
  stopInstance,
} from '../services/compute';
import defineExpressEndpoint from '../../shared/expressEndpoint';
import { MCS_PORT, MCS_TOKEN_SECRET, METADATA, PROJECT_ID } from '../constants';
import { createMcsAuthHeaders } from '../../shared/mcs-token';

const mcs = express().use(withAuth());
export default mcs;

interface Requests {
  '/list': {
    pageToken?: string;
  };
  '/create': {
    name: string;
    machineType: string;
    diskSizeGb: number;
    javaMemorySizeGb: number;
  };
  '/:instance/start': {};
  '/:instance/stop': {};
  '/:instance/delete': {};
  '/:instance/status': {};
}

const mcsServerApis = defineExpressEndpoint.many<Requests>()({
  '/list': async (_params, req, extra) => {
    const { pageToken } = req;
    const compute = extra.compute!;
    const data = await listInstances(compute, pageToken);
    return data;
  },
  '/create': async (_params, req, extra) => {
    const { name, machineType, diskSizeGb, javaMemorySizeGb } = req;
    const compute = extra.compute!;
    const data = await createInstance(compute, name, { machineType, diskSizeGb, javaMemorySizeGb });
    return data;
  },
  '/:instance/start': async (params, _req, extra) => {
    const { instance } = params;
    const compute = extra.compute!;
    const data = await startInstance(compute, instance!);
    return data;
  },
  '/:instance/stop': async (params, _req, extra) => {
    const { instance } = params;
    const compute = extra.compute!;
    const data = await stopInstance(compute, instance!);
    return data;
  },
  '/:instance/delete': async (params, _req, extra) => {
    const { instance } = params;
    const compute = extra.compute!;
    const data = await deleteInstance(compute, instance!);
    return data;
  },
  '/:instance/status': async (params, _req, extra) => {
    const { instance } = params;
    const compute = extra.compute!;
    const data = await getInstanceInfo(compute, instance!);
    return data;
  },
});

mcsServerApis['/list'](mcs, 'get');
mcsServerApis['/create'](mcs, 'post');
mcsServerApis['/:instance/start'](mcs, 'post');
mcsServerApis['/:instance/stop'](mcs, 'post');
mcsServerApis['/:instance/delete'](mcs, 'post');
mcsServerApis['/:instance/status'](mcs, 'get');

interface McsProxyConfig {
  path: string;
  pathRewrite: (params: ParamsDictionary) => string;
}

const PROXIES: McsProxyConfig[] = [
  {
    path: '/:instance/log/:target',
    pathRewrite: ({ target }) => `/log/${target}`,
  },
  {
    path: '/:instance/make-dispatch/:target',
    pathRewrite: ({ target }) => `/make-dispatch/${target}`,
  },
  {
    path: '/:instance/make-stream/:target',
    pathRewrite: ({ target }) => `/make-stream/${target}`,
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
        const { instance } = req.params;
        const hostname = `${instance}.${METADATA.ZONE}.c.${PROJECT_ID}.internal`;
        if (process.env.NODE_ENV === 'production') {
          return `http://${hostname}:${MCS_PORT}`;
        } else {
          const extra = global.createRequestExtra?.(req) || {};
          const { globalIP } = await getInstanceInfo(extra.compute!, instance!);
          if (!globalIP) {
            // eslint-disable-next-line no-console
            console.log('Target instance inactive: skipped proxy');
            throw {};
          }
          return `http://${globalIP}:${MCS_PORT}`;
        }
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

export type { mcsServerApis };
