import React, { createContext, useContext, useMemo } from 'react';
import ResponseResult from '../../shared/responseResult';
import toast from '../components/_overlays/toast';
import authService from '../services/auth';
import mcsService from '../services/minecraft-server';
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
        create: injectResultToast(
          mcsService.create,
          () => {
            toast.success('Machine successfully created');
          },
          (_, message) => {
            toast.danger(`Failed to create due to "${message}"`);
          },
        ),
        start: injectResultToast(
          mcsService.start,
          () => {
            toast.success('Machine successfully started');
          },
          (_, message) => {
            toast.danger(`Failed to start machine due to "${message}"`);
          },
        ),
        stop: injectResultToast(
          mcsService.stop,
          () => {
            toast.success('Machine successfully stopped');
          },
          (_, message) => {
            toast.danger(`Failed to stop machine due to "${message}"`);
          },
        ),
        delete: injectResultToast(
          mcsService.delete,
          () => {
            toast.success('Machine successfully deleted');
          },
          (_, message) => {
            toast.danger(`Failed to delete machine due to "${message}"`);
          },
        ),
        status: injectResultToast(
          mcsService.status,
          () => {},
          (_, message) => {
            toast.danger(`Failed to retrieve machine info due to "${message}"`);
          },
        ),
      },
      user: {
        ...userService,
      },
    };
  }, []);

  return <ServiceContext.Provider value={value} children={children} />;
  function injectResultToast<T extends {}, U extends any[]>(
    fn: (...args: U) => Promise<ResponseResult.Result<T>>,
    success: (data: T) => void,
    error: (status: number, message: string) => void,
  ): typeof fn {
    return async (...args: U) => {
      const result = await fn(...args);
      if (result.error === null) {
        success(result.data);
      } else {
        error(result.error.status, result.error.message);
      }
      return result;
    };
  }
};

export const useServices = () => {
  return useContext(ServiceContext);
};
