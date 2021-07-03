import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import type ResponseResult from './responseResult';

type Method = 'get' | 'post';
type Fetch<Req, Res> = (body: Req, baseURL?: string) => Promise<ResponseResult.Result<Res>>;

export default function createApiClient<T extends {}>(
  config: AxiosRequestConfig,
  configureClient?: (client: AxiosInstance) => void,
) {
  type Target = [path: Extract<keyof T, string>, method: Method];
  type RequestFunc<V extends Target> = T[V[0]] extends [infer Req, infer Res] ? Fetch<Req, Res> : never;
  interface TargetMap {
    [alias: string]: Target;
  }

  const client = axios.create({
    ...config,
    transformResponse: (data) => {
      if (typeof data === 'string') {
        try {
          return JSON.parse(data);
        } catch (e) {} // eslint-disable-line no-empty
      }
      return data;
    },
  });
  configureClient?.(client);

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

const createFetch = (client: AxiosInstance, path: string, method: Method): Fetch<{}, any> => {
  return function fetch(body: {}, baseURL?: string): Promise<ResponseResult.Result<any>> {
    switch (method) {
      case 'get':
        return client
          .get<ResponseResult.Success<any>>(path, { baseURL, params: body })
          .then(({ data }) => data)
          .catch(handleError);
      case 'post':
        return client
          .post<ResponseResult.Success<any>>(path, body, { baseURL })
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
