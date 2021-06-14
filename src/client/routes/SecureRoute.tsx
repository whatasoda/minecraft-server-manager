import React, { useEffect } from 'react';
import { useAuth } from '../contexts/auth';
import { Route, RouteProps } from 'react-router-dom';

export const SecureRoute = (props: RouteProps) => {
  const { user, login } = useAuth();

  useEffect(() => {
    if (user === 0) {
      login();
    }
  }, [user]);

  return user ? <Route {...props} /> : null;
};
