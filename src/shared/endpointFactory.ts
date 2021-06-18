declare global {
  namespace Endpoints {
    interface Extra {}
  }
}

type PathParamKeys<T extends string, A extends string[] = []> =
  // prettier-ignore
  string extends T
    ? string
    : T extends `/${infer U}`
      ? PathParamKeys<U, A>
      : T extends `:${infer U}`
        ? U extends `${infer V}/${infer W}`
          ? PathParamKeys<W, [...A, V]>
          : PathParamKeys<'', [...A, U]>
        : T extends `${string}/${infer U}`
          ? PathParamKeys<U, A>
          : A[number];
export type PathParams<T extends string> = Partial<Record<PathParamKeys<T, []>, string>>;

type Body = Record<string, any>;

export interface EndpointAdopter<A extends any[], F> {
  (definition: Readonly<EndpointDefinition<string, Body, Body>>, ...args: A): F;
}

export interface RequestHandlerDefinition<P extends string, Req extends Body, Res extends Body> {
  (params: PathParams<P>, req: Req, extra: Endpoints.Extra): Promise<Res>;
}

export interface RequestHandler<P extends string, Req extends Body, Res extends Body> {
  (params: PathParams<P>, req: Req, extra: Endpoints.Extra): Promise<Res | ApiError>;
}

export interface EndpointDefinition<P extends string, Req extends Body, Res extends Body> {
  path: P;
  handler: RequestHandler<P, Req, Res>;
}

export interface DefineEndpoint<A extends any[], F> {
  <P extends string, Req extends Body, Res extends Body>(
    path: P,
    handler: RequestHandlerDefinition<P, Req, Res>,
  ): CreateEndpoint<P, Req, Res, A, F>;
  many<ReqMap extends {}>(): {
    <
      T extends {
        [P in Extract<keyof ReqMap, string>]: RequestHandlerDefinition<P, ReqMap[P], any>;
      },
    >(
      definitions: T,
    ): {
      [P in Extract<keyof ReqMap, string>]: T[P] extends RequestHandlerDefinition<P, ReqMap[P], infer Res>
        ? CreateEndpoint<P, ReqMap[P], Res, A, F>
        : never;
    };
  };
}

export interface CreateEndpoint<P extends string, Req extends Body, Res extends Body, A extends any[], F> {
  (...args: A): F;
  definition: EndpointDefinition<P, Req, Res>;
}

export class ApiError extends Error {
  constructor(public readonly status: number = 500, message?: string) {
    super(message);
  }
}

export default function createEndpointFactory<A extends any[], F>(adopter: EndpointAdopter<A, F>) {
  const defineEndpoint: DefineEndpoint<A, F> = <P extends string, Req extends Body, Res extends Body>(
    path: P,
    handlerDefinition: RequestHandlerDefinition<P, Req, Res>,
  ) => {
    const createEndpoint: CreateEndpoint<P, Req, Res, A, F> = (...args: A) => {
      return adopter(createEndpoint.definition as EndpointDefinition<string, Body, Body>, ...args);
    };
    createEndpoint.definition = {
      path,
      handler: async (params, body, extra) => {
        try {
          return await handlerDefinition(params, body, extra);
        } catch (err) {
          const error =
            err instanceof Error
              ? err instanceof ApiError
                ? err
                : new ApiError(500, `${err.name}: ${err.message}`)
              : new ApiError(500, err);
          return error;
        }
      },
    };

    return createEndpoint;
  };

  defineEndpoint.many = <ReqMap extends Record<string, {}>>() => {
    return <
      T extends {
        [P in Extract<keyof ReqMap, string>]: RequestHandlerDefinition<P, ReqMap[P], any>;
      },
    >(
      definitions: T,
    ) => {
      const entries = Object.entries(definitions) as [string, RequestHandlerDefinition<string, any, any>][];
      return entries.reduce<Record<string, CreateEndpoint<string, any, any, A, F>>>((acc, [path, handler]) => {
        acc[path] = defineEndpoint(path, handler);
        return acc;
      }, {}) as {
        [P in Extract<keyof ReqMap, string>]: T[P] extends RequestHandlerDefinition<P, ReqMap[P], infer Res>
          ? CreateEndpoint<P, ReqMap[P], Res, A, F>
          : never;
      };
    };
  };

  return defineEndpoint;
}
