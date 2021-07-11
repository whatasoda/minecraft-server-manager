import { useCallback, useMemo, useReducer, useRef } from 'react';
import { bindAll } from '../../shared/utils/function';
import { createPromise } from '../../shared/utils/promise';

interface ActionContext<S, A> {
  getState: () => S;
  dispatch: (action: A) => Promise<void>;
}

export default function createStoreHook<S, A, T extends {}>(
  reducer: (state: S, action: A) => S,
  createActions: (context: ActionContext<S, A>) => T,
) {
  const promiseMap = new Map<{}, { resolve: () => void }>();
  return function useStore(initialState: S | (() => S)) {
    const reduce = useCallback<typeof reducer>((state, action) => {
      const next = reducer(state, action);
      stateRef.current = next;
      promiseMap.get(action)?.resolve();
      return next;
    }, []);
    const [state, dispatch] = useReducer(reduce, undefined, () => {
      return initialState instanceof Function ? initialState() : initialState;
    });
    const stateRef = useRef(state);
    const actions = useMemo(() => {
      return bindAll(
        createActions({
          getState: () => stateRef.current,
          dispatch: (action) => {
            const { promise, resolve } = createPromise<void>();
            promiseMap.set(action, { resolve });
            promise.then(() => promiseMap.delete(action));
            dispatch(action);
            return promise;
          },
        }),
      );
    }, []);
    return [state, actions];
  };
}
