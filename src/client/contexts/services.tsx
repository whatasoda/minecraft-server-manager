import React, { createContext, useContext, useMemo } from 'react';
import authService from '../services/auth';
import mcsService from '../services/mcs';
import userService from '../services/user';

const base = {
  auth: authService,
  mcs: mcsService,
  user: userService,
};
const ServiceContext = createContext(base);

export const ServiceProvider: React.FC = ({ children }) => {
  const value = useMemo<typeof base>(() => {
    return {
      auth: authService,
      mcs: {
        ...mcsService,
      },
      user: {
        ...userService,
      },
    };
  }, []);

  return <ServiceContext.Provider value={value} children={children} />;
};

export const useServices = () => {
  return useContext(ServiceContext);
};
