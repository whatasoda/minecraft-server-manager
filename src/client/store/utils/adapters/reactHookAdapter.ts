import { createAdapter } from '../factory';
import { useEffect, useMemo, useReducer } from 'react';

export default createAdapter((createCore) => {
  return function useStore(props: Parameters<typeof createCore>[0]) {
    const { reducer, initialState, actions, effects } = useMemo(() => {
      const { reducer, initialState, createStaticItems } = createCore(props);
      const { actions, effects: effectRecord } = createStaticItems((action) => dispatch(action));
      const effects = Object.values(effectRecord);
      return { reducer, initialState, actions, effects };
    }, []);
    const [state, dispatch] = useReducer(reducer, initialState);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    effects.forEach((effect) => useEffect(...effect(state)));
    return [state, actions] as const;
  };
});
