type ResultErrorResponse = { error: string; data: null };
type ResultClientError = { error: Error; data: null };
export type ErrorResult = ResultErrorResponse | ResultClientError;
export type Result<T> = { error: null; data: T } | ErrorResult;
export type AsyncResult<T> = Promise<Result<T>>;

export const Result = {
  clientError(err: Error): ResultClientError {
    return {
      error: err instanceof Error ? err : new Error(err),
      data: null,
    };
  },
  error(err: Error | string): ResultErrorResponse {
    return {
      error: typeof err === 'string' ? err : err.message || err.toString(),
      data: null,
    };
  },
  ok<T>(data: T): Result<T> {
    return {
      error: null,
      data,
    };
  },
};
