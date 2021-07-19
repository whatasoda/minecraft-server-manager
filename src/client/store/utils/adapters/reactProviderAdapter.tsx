import React, { createContext, memo, useContext } from 'react';
import { createSelectorCreator, defaultMemoize } from 'reselect';
import shallowequal from 'shallowequal';
import { createContext as createSelectableContext, useContextSelector } from 'use-context-selector';
import { createAdapter } from '../factory';
import reactHookAdapter from './reactHookAdapter';

const createSelector = createSelectorCreator(defaultMemoize, (a, b) => shallowequal(a, b));

export default createAdapter((createCore) => {
  const useStore = reactHookAdapter(createCore);

  type Props = Parameters<typeof useStore>[0];
  type State = ReturnType<typeof useStore>[0];
  type Actions = ReturnType<typeof useStore>[1];
  const stateContext = createSelectableContext<State>(null as any);
  const actionContext = createContext<Actions>(null as any);

  const Provider: React.FC<Props> = memo(
    ({ children, ...props }) => {
      const [state, actions] = useStore(props as Props);
      return (
        <stateContext.Provider value={state}>
          <actionContext.Provider value={actions} children={children} />
        </stateContext.Provider>
      );
    },
    () => true,
  );

  const createConsumer = <T extends {}>(selector: (state: State) => T) => {
    const select = createSelector(selector, (value) => value);
    return function useSelectedState() {
      const state = useContextSelector(stateContext, select);
      const actions = useContext(actionContext);
      return [state, actions] as const;
    };
  };

  return { Provider, createConsumer };
});
