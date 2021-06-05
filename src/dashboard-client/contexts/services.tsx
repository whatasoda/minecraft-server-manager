import React, { createContext, useContext, useMemo } from 'react';
import { Result } from '../../dashboard-server/utils/result';
import toast from '../components/_overlays/toast';
import authService from '../services/auth';
import minecraftServerService from '../services/minecraft-server';
import userService from '../services/user';

const base = {
  auth: authService,
  minecraftServer: minecraftServerService,
  user: userService,
};
const ServiceContext = createContext(base);

export const ServiceProvider: React.FC = ({ children }) => {
  const value = useMemo<typeof base>(() => {
    return {
      auth: authService,
      minecraftServer: {
        ...minecraftServerService,
        createMachine: injectResultToast(
          minecraftServerService.createMachine,
          () => {
            toast.success('Machine successfully created');
          },
          (message) => {
            toast.danger(`Machine creation failed due to "${message}"`);
          },
        ),
      },
      user: {
        ...userService,
      },
    };
  }, []);

  return <ServiceContext.Provider value={value} children={children} />;
  function injectResultToast<T extends any, U extends any[]>(
    fn: (...args: U) => Promise<Result<T>>,
    success: (data: T) => void,
    error: (message: string) => void,
  ): typeof fn {
    return async (...args: U) => {
      const result = await fn(...args);
      if (result.error === null) {
        success(result.data);
      } else {
        error(Result.error(result.error).error);
      }
      return result;
    };
  }
};

export const useServices = () => {
  return useContext(ServiceContext);
};
