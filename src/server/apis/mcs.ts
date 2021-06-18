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
  proxyToInstance((target) => `/log/${target}`),
);
mcs.post(
  '/:instance/make-dispatch/:target',
  proxyToInstance((target) => `/make-dispatch/${target}`),
);
mcs.get(
  '/:instance/make-stream/:target',
  proxyToInstance((target) => `/make-stream/${target}`),
);

export type { mcsServerApis };
