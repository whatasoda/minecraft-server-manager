import React from 'react';
import { AuthProvider } from './contexts/auth';
import { ServiceProvider } from './contexts/services';
import Routes from './routes';

export default function App() {
  return (
    <ServiceProvider>
      <AuthProvider>
        <Routes />
      </AuthProvider>
    </ServiceProvider>
  );
}
