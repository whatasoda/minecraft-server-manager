import React, { createContext, useContext } from 'react';

export default function createCoreState<T>(coreStateHook: () => T) {
  const context = createContext<T>(null as any);

  const CoreStateProvider: React.FC = ({ children }) => {
    return <context.Provider value={coreStateHook()} children={children} />;
  };

  const createCoreStateHOC = <P extends {}>(Component: React.ComponentType<P>) => {
    return function CoreStateHOC(props: P) {
      return <CoreStateProvider children={<Component {...props} />} />;
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
