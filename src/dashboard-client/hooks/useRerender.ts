import { useReducer } from 'react';

export default function useRerender(): () => void {
  return useReducer((c) => ++c, 0)[1];
}
