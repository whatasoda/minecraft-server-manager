import { createAdapter } from '../factory';
import { useEffect, useMemo, useReducer } from 'react';

export default createAdapter((createCore, initialStateInit) => {
  const { reducer, initialState, actions, effects } = useMemo(() => {
    const { reducer, stateRef, createStaticItems } = createCore(initialStateInit);
    const { current: initialState } = stateRef;
    const { actions, effects: effectRecord } = createStaticItems((action) => dispatch(action));
    const effects = Object.values(effectRecord);
    return { reducer, initialState, actions, effects };
  }, []);
  const [state, dispatch] = useReducer(reducer, initialState);
  effects.forEach((effect) => useEffect(...effect(state)));
  return [state, actions] as const;
});
