import React from 'react';
import { BrowserRouter, Switch } from 'react-router-dom';
import { AuthProvider } from '../contexts/auth';
import Home from '../pages/Home';
import { SecureRoute } from './SecureRoute';

export default function Rotues() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Switch>
          <SecureRoute path="/" component={Home} />
        </Switch>
      </BrowserRouter>
    </AuthProvider>
  );
}
