import React, { createContext, useContext, useMemo } from 'react';
import useRerender from '../hooks/useRerender';

type RefreshPolicy = 'individual' | 'mixed';

interface LoadingControl<T extends string> {
  items: Partial<Record<T, boolean>>;
  isLoading: boolean;
  setLoading: (key: T, value: boolean) => void;
}

const LoadingContext = createContext<LoadingControl<string>>(null as any);

export default function createLoadingGroup<T extends string>(policy: RefreshPolicy) {
  const LoadingProvider: React.FC = ({ children }) => {
    const rerender = useRerender();

    const makeValue = useMemo(() => {
      let isLoading = false;
      const loadingKeys = new Set<T>();

      const setLoading = (key: T, isLoading: boolean) => {
        const noChange = isLoading === loadingKeys.has(key);
        if (noChange) {
          return;
        }
        loadingKeys[isLoading ? 'add' : 'delete'](key);
        if (policy === 'mixed') {
          const next = !!loadingKeys.size;
          if (next !== isLoading) {
            isLoading = next;
            rerender();
          }
        } else {
          rerender();
        }
      };

      return () => {
        const items: Partial<Record<T, boolean>> = {};
        loadingKeys.forEach((key) => {
          items[key] = true;
        });
        return { items, setLoading, isLoading };
      };
    }, []);
    const value = useMemo(() => makeValue(), [rerender.count]);

    return <LoadingContext.Provider value={value as LoadingControl<string>} children={children} />;
  };

  const bindLoadingProvider = <P extends {}>(Component: React.ComponentType<P>): React.FC<P> => {
    return function LoadingGroupRoot(props) {
      return <LoadingProvider children={<Component {...props} />} />;
    };
  };

  const useLoading = () => {
    return useContext(LoadingContext) as LoadingControl<T>;
  };

  return { LoadingProvider, bindLoadingProvider, useLoading };
}
