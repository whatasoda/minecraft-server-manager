import express from 'express';
import type { Request, Response } from 'express-serve-static-core';
import { request } from 'http';
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

const mcs = express().use(withAuth());
export default mcs;

const define = defineExpressEndpoint;

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
  '/:instance/log/:target': {};
  '/:instance/make-dispatch/:target': {};
  '/:instance/make-stream/:target': {};
}

const apis = {
  '/list': define('/list', async (_params, req: Requests['/list'], extra) => {
    const { pageToken } = req;
    const compute = extra.compute!;
    const data = await listInstances(compute, pageToken);
    return { machines: data.instances, nextQuery: data.nextQuery };
  }),
  '/create': define('/create', async (_params, req: Requests['/create'], extra) => {
    const { name, machineType, diskSizeGb, javaMemorySizeGb } = req;
    const compute = extra.compute!;
    const data = await createInstance(compute, name, { machineType, diskSizeGb, javaMemorySizeGb });
    return data;
  }),
  '/:instance/start': define('/:instance/start', async (params, _req: Requests['/:instance/start'], extra) => {
    const { instance } = params;
    const compute = extra.compute!;
    const data = await startInstance(compute, instance!);
    return data;
  }),
  '/:instance/stop': define('/:instance/stop', async (params, _req: Requests['/:instance/stop'], extra) => {
    const { instance } = params;
    const compute = extra.compute!;
    const data = await stopInstance(compute, instance!);
    return data;
  }),
  '/:instance/delete': define('/:instance/delete', async (params, _req: Requests['/:instance/delete'], extra) => {
    const { instance } = params;
    const compute = extra.compute!;
    const data = await deleteInstance(compute, instance!);
    return data;
  }),
  '/:instance/status': define('/:instance/status', async (params, _req: Requests['/:instance/status'], extra) => {
    const { instance } = params;
    const compute = extra.compute!;
    const data = await getInstanceInfo(compute, instance!);
    return data;
  }),
  // 'path': define('path', async (params, req: Requests['path'], extra) => {}),
};

apis['/list'](mcs, 'get');
apis['/create'](mcs, 'post');
apis['/:instance/start'](mcs, 'post');
apis['/:instance/stop'](mcs, 'post');
apis['/:instance/delete'](mcs, 'post');
apis['/:instance/status'](mcs, 'get');

const PROJECT_ID = '';
const ZONE = 'asia-northeast1-a';

const proxyToInstance = (createPath: (target: string) => string) => {
  return (req: Request, res: Response) => {
    const { instance, target } = req.params;
    request({
      host: `${instance}.${ZONE}.c.${PROJECT_ID}.internal`,
      port: 8000,
      path: createPath(target),
    }).pipe(res);
  };
};

mcs.get(
  '/:instance/log/:target',
  proxyToInstance((target) => `/api/log/${target}`),
);
mcs.post(
  '/:instance/make-dispatch/:target',
  proxyToInstance((target) => `/api/make-dispatch/${target}`),
);
mcs.get(
  '/:instance/make-stream/:target',
  proxyToInstance((target) => `/api/make-stream/${target}`),
);

export type { apis };
