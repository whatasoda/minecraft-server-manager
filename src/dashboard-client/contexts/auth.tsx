import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import authService from '../services/auth';
import userService, { User } from '../services/user';

interface AuthContextDynamicValue extends AuthContextStaticValue {
  user: User | 0 | null;
}

interface AuthContextStaticValue {
  refresh: () => Promise<void>;
  login: (callbackUrl?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const dynamicContext = createContext<AuthContextDynamicValue>(null as any);
const staticContext = createContext<AuthContextStaticValue>(null as any);

export const AuthProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState<User | 0 | null>(null);

  const refresh = async () => {
    setUser((await userService.profile()) || 0);
  };

  const login = (callbackUrl: string = location.href) => {
    return authService.login(callbackUrl);
  };

  const logout = async () => {
    await authService.logout();
    await refresh();
  };

  useEffect(() => {
    refresh();
  }, []);

  const staticValue = useMemo<AuthContextStaticValue>(() => {
    return { login, logout, refresh };
  }, []);
  const dynamicValue = useMemo<AuthContextDynamicValue>(() => {
    return { ...staticValue, user };
  }, [user]);

  return (
    <staticContext.Provider value={staticValue}>
      <dynamicContext.Provider value={dynamicValue} children={children} />
    </staticContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(dynamicContext);
};

export const useAuthStatics = () => {
  return useContext(staticContext);
};
