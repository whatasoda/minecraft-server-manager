import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import type ResponseResult from './responseResult';

type Method = 'get' | 'post';
type Fetch<B, P> = (body: B, baseURL?: string) => Promise<ResponseResult.Result<P>>;

interface CreateFetchConfig<K extends PropertyKey, T> {
  path: Extract<K, string>;
  method: Method;
  onResponse?: (response: T extends [any, infer P] ? ResponseResult.Result<P> : never) => void;
}

export default function createApiClient<T extends {}>(
  config: AxiosRequestConfig,
  configureClient?: (client: AxiosInstance) => void,
) {
  type Config = {
    [K in keyof T]: CreateFetchConfig<K, T[K]>;
  }[keyof T];
  type RequestFunc<V extends Config> = T[V['path']] extends [infer B, infer P] ? Fetch<B, P> : never;
  interface TargetMap {
    [alias: string]: Config;
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
    const entries = Object.entries(pathMap) as [string, Config][];
    return entries.reduce<Record<string, any>>((acc, [alias, config]) => {
      acc[alias] = createFetch(client, config);
      return acc;
    }, {}) as {
      [K in keyof U]: RequestFunc<U[K]>;
    };
  };
}

const createFetch = <K extends PropertyKey, T>(
  client: AxiosInstance,
  config: CreateFetchConfig<K, T>,
): Fetch<{}, any> => {
  const { path, method, onResponse } = config;
  return function fetch(body: {}, baseURL?: string): Promise<ResponseResult.Result<any>> {
    const promise = (() => {
      switch (method) {
        case 'get':
          return client.get<ResponseResult.Success<any>>(path, { baseURL, params: body });
        case 'post':
          return client.post<ResponseResult.Success<any>>(path, body, { baseURL });
      }
    })();
    const response = promise.then(({ data }) => data).catch(handleError);
    response.then((res) => onResponse?.(res as any));

    return response;
  };
};

const handleError = (error: AxiosError): ResponseResult.Error => {
  if (error.response) {
    return error.response.data;
  } else {
    return { data: null, error: { status: NaN, message: error.toString() } };
  }
};
