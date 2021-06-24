import { RequestHandler } from 'express';
import CloudMetadata from '../shared/cloud-metadata';
import { ApiError } from '../shared/endpointFactory';
import evaluateToken from '../shared/evaluateToken';
import ResponseResult from '../shared/responseResult';

const { metadata, waitForMetadataLoad } = CloudMetadata({
  tokenSecret: {
    path: '/computeMetadata/v1/instance/mcs-token-secret',
    fallback: '',
  },
  hostname: {
    path: '/instance/hostname',
    fallback: '',
  },
});

export default async function withDevAuth(): Promise<RequestHandler | null> {
  await new Promise<void>((resolve) => {
    waitForMetadataLoad(resolve);
  });

  const { tokenSecret, hostname } = metadata;
  if (!tokenSecret || !hostname) {
    return null;
  }

  return function DevAuthMiddleware(req, res, next) {
    const { ['X-MCS-TOKEN']: receivedToken } = req.headers;
    const computedToken = evaluateToken(hostname, tokenSecret);

    if (receivedToken === computedToken) {
      next();
    } else {
      res.status(403).json(ResponseResult.error(new ApiError(403, 'missing token')));
    }
  };
}
