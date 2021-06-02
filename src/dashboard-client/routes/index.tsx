import React from 'react';
import { BrowserRouter, Switch } from 'react-router-dom';
import CreateServer from '../components/CreateServer';
import { AuthProvider } from '../contexts/auth';
import { SecureRoute } from './SecureRoute';

export default function Rotues() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Switch>
          <SecureRoute path="/servers/create" component={CreateServer} />
        </Switch>
      </BrowserRouter>
    </AuthProvider>
  );
}
