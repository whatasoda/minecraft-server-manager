import axios, { AxiosError, AxiosInstance } from 'axios';
import type ResponseResult from '../../shared/responseResult';

type Method = 'get' | 'post';

export default function createApiClient<T extends {}>(baseURL: string) {
  type Target = [path: Extract<keyof T, string>, method: Method];
  type RequestFunc<V extends Target> = T[V[0]] extends [infer Req, infer Res]
    ? (body: Req) => Promise<ResponseResult.Result<Res>>
    : never;
  interface TargetMap {
    [alias: string]: Target;
  }

  const client = axios.create({
    baseURL,
    transformResponse: (data: string) => {
      if (typeof data === 'string') {
        try {
          return JSON.parse(data);
        } catch (e) {} // eslint-disable-line no-empty
      }
      return data;
    },
  });

  return function makeAlias<U extends TargetMap>(pathMap: U) {
    const entries = Object.entries(pathMap) as [string, Target][];
    return entries.reduce<Record<string, any>>((acc, [alias, [path, method]]) => {
      acc[alias] = createFetch(client, path, method);
      return acc;
    }, {}) as {
      [K in keyof U]: RequestFunc<U[K]>;
    };
  };
}

const createFetch = (client: AxiosInstance, path: string, method: Method) => {
  return function fetch(body: {}): Promise<ResponseResult.Result<any>> {
    switch (method) {
      case 'get':
        return client
          .get<ResponseResult.Success<any>>(path, { params: body })
          .then(({ data }) => data)
          .catch(handleError);
      case 'post':
        return client
          .post<ResponseResult.Success<any>>(path, body)
          .then(({ data }) => data)
          .catch(handleError);
    }
  };
};

const handleError = (error: AxiosError): ResponseResult.Error => {
  if (error.response) {
    return error.response.data;
  } else {
    return { data: null, error: { status: NaN, message: error.toString() } };
  }
};
