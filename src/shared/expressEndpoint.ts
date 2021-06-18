import Compute from '@google-cloud/compute';
import express from 'express';
import type { Request, Response } from 'express-serve-static-core';
import createEndpointFactory, { ApiError } from './endpointFactory';
import ResponseResult from './responseResult';

type SupportedMethod = 'get' | 'post';
const PROJECT_ID = 'whatasoda-mc-server';

declare global {
  namespace Endpoints {
    interface Extra {
      compute?: Compute;
    }
  }
}

const defineExpressEndpoint = createEndpointFactory((definition, app: express.Express, method: SupportedMethod) => {
  const { path, handler } = definition;
  switch (method) {
    case 'get':
    case 'post':
      return app[method](path, async (req, res) => {
        const body = {
          get: req.query,
          post: req.body,
        }[method];
        const dataOrError = await handler(req.params, body, createExtra(req));
        sendResponse(res, dataOrError);
      });
    default:
      return app;
  }
});

const createExtra = (req: Request): Endpoints.Extra => ({
  compute: req.authClient ? new Compute({ projectId: PROJECT_ID, authClient: req.authClient }) : undefined,
});

export const sendResponse = (res: Response, dataOrError: any) => {
  if (dataOrError instanceof ApiError) {
    res.status(dataOrError.status).json(ResponseResult.error(dataOrError));
  } else {
    res.status(200).json(ResponseResult.success(dataOrError));
  }
};

export default defineExpressEndpoint;
