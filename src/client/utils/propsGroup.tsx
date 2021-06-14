import React, { createContext, createElement, useContext } from 'react';

export default function createPropsGroup<GP extends {}>(defaultProps: GP) {
  const GroupContext = createContext<GP>(defaultProps);

  const bind = <P extends {}>(
    Component: React.ComponentType<P>,
    transform: (groupProps: GP, props: P) => Partial<P>,
  ): React.FC<P> => {
    return function PropsGroupChild(props: P) {
      const groupProps = useContext(GroupContext);
      return createElement(Component, { ...props, ...transform(groupProps, props) });
    };
  };

  const createParent = <P extends {}>(
    Component: React.ComponentType<P & GP> | React.ComponentType<P>,
  ): React.FC<P & GP> => {
    return function PropsGroupParent(props: P & GP) {
      return (
        <GroupContext.Provider
          value={props}
          children={createElement(Component as React.ComponentType<P & GP>, props)}
        />
      );
    };
  };

  return { bind, createParent };
}
