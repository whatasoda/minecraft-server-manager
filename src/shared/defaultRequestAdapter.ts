import { ErrorResponse, JsonResponse, RequestHandlerAdapter } from './requestHandlerFactory';
import ResponseResult from './responseResult';

export const defaultAdapter: RequestHandlerAdapter = {
  resolveRequest: (req) => {
    const body = {
      get: req.query,
      post: req.body,
    }[req.method.toLowerCase() as 'get' | 'post'];
    return { body };
  },
  resolveResponse: (res, data) => {
    if (data instanceof ErrorResponse) {
      res.status(data.status).json(ResponseResult.error(data));
    } else if (data instanceof JsonResponse) {
      res.status(200).json(ResponseResult.success(data.data));
    }
  },
};
