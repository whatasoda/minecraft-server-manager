import { RequestHandler } from 'express';
import CloudMetadata from '../shared/cloud-metadata';
import { veirfyRequest } from '../shared/mcs-token';
import { ErrorResponse } from '../shared/requestHandlerFactory';
import ResponseResult from '../shared/responseResult';

const { metadata, waitForMetadataLoad } = CloudMetadata({
  tokenSecret: {
    path: '/computeMetadata/v1/instance/attributes/mcs-token-secret',
    fallback: '',
  },
  hostname: {
    path: '/computeMetadata/v1/instance/hostname',
    fallback: '',
  },
});

export default async function withMcsAuth(): Promise<RequestHandler> {
  await new Promise<void>((resolve) => {
    waitForMetadataLoad(resolve);
  });

  const { tokenSecret, hostname } = metadata;
  if (!tokenSecret || !hostname) {
    throw new Error('No secret found');
  }

  return function McsAuthMiddleware(req, res, next) {
    if (veirfyRequest(req, hostname, tokenSecret)) {
      next();
    } else {
      res.status(403).json(ResponseResult.error(new ErrorResponse(403, 'missing token')));
    }
  };
}
