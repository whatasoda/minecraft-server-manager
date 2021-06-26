import type { RequestHandler } from 'express';
import type { Request, Response } from 'express-serve-static-core';

type Body = Record<string, any>;

export interface RequestHandlerAdapter {
  resolveRequest: (req: Request) => { body: {} };
  resolveResponse: (res: Response, data: JsonResponse | ErrorResponse | ResolvedResponse) => void;
}

export interface HandlerDefinition<Req extends Body, Res extends Body> {
  (body: Req, req: Request, send: (handler: (res: Response) => Promise<void>) => Promise<never>): Promise<Res>;
}

export interface RequestHandlerFactory {
  (adapter: RequestHandlerAdapter): RequestHandler;
}

export class JsonResponse {
  constructor(public data: {}) {}
}

export class ErrorResponse extends Error {
  constructor(public readonly status: number = 500, message?: string) {
    super(message);
  }
}
export class ResolvedResponse {}

export function createRequestHandler<Req extends Body, Res extends Body>(
  handler: HandlerDefinition<Req, Res>,
): RequestHandlerFactory {
  return function factory(adapter: RequestHandlerAdapter): RequestHandler {
    const { resolveRequest, resolveResponse } = adapter;
    return async function handleRequest(req, res) {
      const { body } = resolveRequest(req);
      const send = async (handler: (res: Response) => Promise<void>): Promise<never> => {
        try {
          await handler(res);
        } catch (e) {
          // TODO: check if the response is really resolved. If not, throw ErrorRepsonse
        }
        throw new ResolvedResponse();
      };
      return resolveResponse(res, await handle());

      async function handle(): Promise<JsonResponse | ErrorResponse | ResolvedResponse> {
        try {
          const data = await handler(body as Req, req, send);
          return new JsonResponse(data);
        } catch (err) {
          if (err instanceof ResolvedResponse) {
            // TODO: check if the response is really resolved
            return err;
          }
          const error =
            err instanceof Error
              ? err instanceof ErrorResponse
                ? err
                : new ErrorResponse(500, `${err.name}: ${err.message}`)
              : new ErrorResponse(500, err);
          return error;
        }
      }
    };
  };
}

type VerifyPath<T extends string, Curr extends string = T> =
  /* eslint-disable @typescript-eslint/no-unused-vars */
  // prettier-ignore
  string extends Curr
    ? never
    : Curr extends `/${infer U}`
      ? U extends `:${infer _}`
        ? never
        : U extends `${infer _}/${infer W}`
          ? VerifyPath<T, `/${W}`>
          : T
      : never;
/* eslint-enable @typescript-eslint/no-unused-vars */

type DefMapKey<DefMap extends {}> = {
  [K in keyof DefMap]: DefMap[K] extends [{}, any] ? VerifyPath<Extract<K, string>> : never;
}[keyof DefMap];

export default function createRequestHandlers<DefMap extends {}>(
  handlers: {
    [K in DefMapKey<DefMap>]: DefMap[K] extends [infer Req, infer Res] ? HandlerDefinition<Req, Res> : never;
  },
) {
  type FactoryRecord = {
    [K in DefMapKey<DefMap>]: RequestHandlerFactory;
  };
  type Endpoint = {
    [K in DefMapKey<DefMap>]: {
      path: K;
      factory: FactoryRecord[K];
    };
  }[DefMapKey<DefMap>];

  const entries = Object.entries(handlers) as [string, HandlerDefinition<any, any>][];

  const endpoints = [] as { path: string; factory: RequestHandlerFactory }[];
  const factories = entries.reduce<Record<string, RequestHandlerFactory>>((acc, [path, handler]) => {
    const factory = createRequestHandler(handler);
    acc[path] = createRequestHandler(handler);
    endpoints.push({ path, factory });
    return acc;
  }, {}) as FactoryRecord;

  const forEach = (callback: (endpoint: Endpoint) => void) => {
    (endpoints as Endpoint[]).forEach((entry) => callback(entry));
    return result;
  };

  const result = { factories, forEach };

  return result;
}
