import { useReducer } from 'react';

type RerenderTmp = { (): void; count: number };
type Rerender = { (): void; readonly count: number };

export default function useRerender(): Rerender {
  const [count, rerender] = useReducer((c) => ++c, 0);
  (rerender as RerenderTmp).count = count;
  return rerender as Rerender;
}
