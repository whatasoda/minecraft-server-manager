import { RequestHandler } from 'express';
import { veirfyRequest } from '../shared/mcs-token';
import { ErrorResponse } from '../shared/requestHandlerFactory';
import ResponseResult from '../shared/responseResult';

const MCS_TOKEN_SECRET = process.env.MCS_TOKEN_SECRET;
const SERVER_HOST = process.env.SERVER_HOST;

export default function withMcsAuth(): RequestHandler {
  if (!MCS_TOKEN_SECRET || !SERVER_HOST) {
    throw new Error('No secret found');
  }

  return function McsAuthMiddleware(req, res, next) {
    if (veirfyRequest(req, SERVER_HOST, MCS_TOKEN_SECRET)) {
      next();
    } else {
      res.status(403).json(ResponseResult.error(new ErrorResponse(403, 'missing token')));
    }
  };
}
