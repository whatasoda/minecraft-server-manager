export const createPromise = <T>() => {
  const payload = {} as {
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: any) => void;
    promise: Promise<T>;
  };
  payload.promise = new Promise((resolve, reject) => {
    payload.resolve = resolve;
    payload.reject = reject;
  });
  return payload;
};
