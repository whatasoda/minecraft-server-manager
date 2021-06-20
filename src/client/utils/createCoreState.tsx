import React, { createContext, useContext } from 'react';

export default function createCoreState<P extends {}, T extends {}>(coreStateHook: (props: P) => T) {
  const context = createContext<T>(null as any);

  const CoreStateProvider: React.FC<P> = ({ children, ...props }) => {
    return <context.Provider value={coreStateHook(props as P)} children={children} />;
  };

  const createCoreStateHOC = <Q extends {}>(Component: React.ComponentType<Q>) => {
    return function CoreStateHOC(props: Q & P) {
      return <CoreStateProvider {...props} children={<Component {...props} />} />;
    };
  };

  const useCoreState = () => {
    return useContext(context);
  };

  return {
    CoreStateProvider,
    createCoreStateHOC,
    useCoreState,
  };
}
