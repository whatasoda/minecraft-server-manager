import { ErrorResponse } from './requestHandlerFactory';

namespace ResponseResult {
  export type Result<T extends {}> = Success<T> | Error;

  export function success<T extends {}>(data: T): Success<T> {
    return { data, error: null };
  }
  export interface Success<T extends {}> {
    data: T;
    error: null;
  }

  export function error(err: ErrorResponse): Error {
    const { status, message } = err;
    return { data: null, error: { status, message } };
  }
  export interface Error {
    data: null;
    error: {
      status: number;
      message: string;
    };
  }
}
export default ResponseResult;
