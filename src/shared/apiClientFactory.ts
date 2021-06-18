import type { EndpointDefinition, PathParams } from './endpointFactory';
import type ResponseResult from './responseResult';

type RequestFuncOf<D extends EndpointDefinition<string, any, any>> = D extends EndpointDefinition<
  any,
  infer Req,
  infer Res
>
  ? (params: PathParams<D['path']>, reqBody: Req) => Promise<ResponseResult.Result<Res>>
  : never;

export default function apiClientFactory(fetch: Window['fetch'], baseUrl: string) {
  baseUrl = trimTailingSlash(baseUrl);

  const createApi = <D extends EndpointDefinition<string, any, any>>(path: D['path'], method: 'GET' | 'POST') => {
    type Params = PathParams<D['path']>;
    type Req = D extends EndpointDefinition<any, infer T, any> ? T : never;
    type Res = D extends EndpointDefinition<any, any, infer T> ? T : never;

    return async function request(params: Params, reqBody: Req): Promise<ResponseResult.Result<Res>> {
      const url = `${baseUrl}${buildPathWithParam(path, params)}`;
      let status: number | null = null;
      const req = buildRequest(method, url, reqBody);
      try {
        const res = await fetch(req);
        status = res.status;
        return (await res.json()) as ResponseResult.Result<Res>;
      } catch (e) {
        return { data: null, error: { status: status || NaN, message: e.toString() } };
      }
    };
    function buildRequest(method: 'GET' | 'POST', url: string, req: Req): Request {
      if (method === 'GET') {
        const queries = Object.entries(req).reduce<string[]>((acc, [key, value]) => {
          switch (typeof value) {
            case 'boolean':
            case 'number':
            case 'string':
              acc.push(`${key}=${encodeURIComponent(value)}`);
              break;
            case 'undefined':
              break;
            default:
              throw new Error(`${typeof value} is not allowed to GET request body for '${url}'`);
          }
          return acc;
        }, []);
        return new Request(`${url}?${queries}`, { method: 'GET' });
      }
      if (method === 'POST') {
        return new Request(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(req),
        });
      }
      throw new Error(`${method} is not allowed to method type for now.`);
    }
  };
  type EndpointRecordBase = Partial<Record<string, { definition: EndpointDefinition<string, any, any> }>>;
  createApi.many = <D extends EndpointRecordBase>() => {
    return <T extends Record<string, [path: NonNullable<D[keyof D]>['definition']['path'], method: 'GET' | 'POST']>>(
      endpoints: T,
    ) => {
      const endpointEntries = Object.entries(endpoints) as [string, [path: string, method: 'GET' | 'POST']][];
      type AccType = Record<string, RequestFuncOf<EndpointDefinition<string, any, any>>>;
      return endpointEntries.reduce<AccType>((acc, [key, [path, method]]) => {
        acc[key] = createApi(path, method);
        return acc;
      }, {}) as {
        [K in keyof T]: RequestFuncOf<NonNullable<D[T[K][0]]>['definition']>;
      };
    };
  };

  return createApi;
}

const buildPathWithParam = (path: string, params: PathParams<string>) => {
  return path.replace(/(?<=\/):([a-zA-Z0-9_-])(?=\/|$)/g, (_, key) => {
    const param = params[key];
    if (param) {
      return param;
    } else {
      throw new Error(`Missed path parameter: '${key}' for endpoint '${path}'`);
    }
  });
};

const trimTailingSlash = (str: string) => {
  return str.replace(/\/$/, '');
};
