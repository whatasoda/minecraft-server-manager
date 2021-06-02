import { useMemo, useRef } from 'react';
import { ErrorResult, Result } from '../../dashboard-server/utils/result';

type ClientFn = (...args: any[]) => Promise<Result<any>>;
type ErrorHook = (err: ErrorResult) => void;

export default function useApiClient<T extends Record<string, ClientFn>, K extends keyof T = never>(
  client: T,
  errorHooks: Record<K, ErrorHook> & Partial<Record<keyof T, ErrorHook>>,
): Pick<T, K> {
  const hooksRef = useRef(errorHooks);
  hooksRef.current = errorHooks;
  const picked = useMemo(() => {
    return (Object.keys(errorHooks) as K[]).reduce<Partial<T>>((acc, key) => {
      const clientFn = client[key];
      const hookFn = hooksRef.current[key];
      const wrapped = async (...args: Parameters<typeof clientFn>) => {
        const result = await clientFn(...args);
        if (!result.data) {
          hookFn(result as ErrorResult);
        }
        return result;
      };
      acc[key] = wrapped as typeof clientFn;
      return acc;
    }, {});
  }, []);
  return picked as Pick<T, K>;
}
