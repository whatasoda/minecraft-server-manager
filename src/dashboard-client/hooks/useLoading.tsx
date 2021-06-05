import { useMemo } from 'react';
import useRerender from './useRerender';

type RefreshPolicy = 'individual' | 'mixed';

export default function useLoading<T extends string>(policy: RefreshPolicy, defaultLoadingKeys: T[] = []) {
  const rerender = useRerender();

  return useMemo(() => {
    let isLoadingSome = false;
    const loadingKeys = new Set<T>(defaultLoadingKeys);

    const setLoading = (key: T, isLoading: boolean) => {
      const noChange = isLoading === loadingKeys.has(key);
      if (noChange) {
        return;
      }
      loadingKeys[isLoading ? 'add' : 'delete'](key);
      if (policy === 'mixed') {
        const next = !!loadingKeys.size;
        if (next !== isLoadingSome) {
          isLoadingSome = next;
          rerender();
        }
      } else {
        rerender();
      }
    };

    return function makeValue() {
      const record: Partial<Record<T, boolean>> = {};
      loadingKeys.forEach((key) => {
        record[key] = true;
      });
      return { record, setLoading, isLoadingSome };
    };
  }, [])();
}
