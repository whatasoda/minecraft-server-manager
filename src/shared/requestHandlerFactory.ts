import { EventEmitter } from 'events';
import type { RequestHandler } from 'express';
import type { Request, Response } from 'express-serve-static-core';
import { v4 as uuid } from 'uuid';

type Body = Record<string, any>;

export interface RequestHandlerAdapter {
  resolveRequest: (req: Request, requestId: string) => { body: {} };
  resolveResponse: (res: Response, data: JsonResponse | ErrorResponse | ResolvedResponse) => void;
}

interface RequestContext<B extends Body> {
  requestId: string;
  body: B;
  req: Request;
  res: Response;
  interrupt: (promise: Promise<void>) => Promise<never>;
  on: (type: 'close', callback: () => void) => void;
}

export interface HandlerDefinition<B extends Body, P extends Body> {
  (context: RequestContext<B>): Promise<P>;
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

export function createRequestHandler<B extends Body, P extends Body>(
  handler: HandlerDefinition<B, P>,
): RequestHandlerFactory {
  return function factory(adapter: RequestHandlerAdapter): RequestHandler {
    const { resolveRequest, resolveResponse } = adapter;
    return async function handleRequest(req, res) {
      const requestId = uuid();
      const emitter = new EventEmitter();
      const context: RequestContext<B> = {
        ...(resolveRequest(req, requestId) as { body: B }),
        requestId,
        req,
        res,
        interrupt: async (promise) => {
          await promise.catch(() => {
            // TODO: check if the response is really resolved. If not, throw ErrorRepsonse
          });
          throw new ResolvedResponse();
        },
        on: (type, callback) => {
          emitter.on(type, callback);
        },
      };

      await resolveResponse(res, await handle());
      emitter.emit('close');
      return;

      async function handle(): Promise<JsonResponse | ErrorResponse | ResolvedResponse> {
        try {
          const data = await handler(context);
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
