import express from 'express';
import { defaultAdapter } from '../../shared/defaultRequestAdapter';
import createRequestHandlers from '../../shared/requestHandlerFactory';
import { withAuth } from './auth';

const user = express().use(withAuth());
export default user;

export interface UserHandlers {
  '/profile': [{}, {}];
}
createRequestHandlers<UserHandlers>({
  '/profile': async () => {
    return {};
  },
}).forEach((endpoint) => {
  switch (endpoint.path) {
    case '/profile':
      user.get(endpoint.path, endpoint.factory(defaultAdapter));
      break;
    default:
      endpoint; // Should be `never` here
  }
});
