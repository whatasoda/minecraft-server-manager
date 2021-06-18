import express from 'express';
import defineExpressEndpoint from '../../shared/expressEndpoint';
import { withAuth } from './auth';

const user = express().use(withAuth());
export default user;

interface Requests {
  '/profile': {};
}
const userApi = {
  '/profile': defineExpressEndpoint('/profile', async (_p, _r: Requests['/profile']) => {
    return {};
  }),
};

userApi['/profile'](user, 'get');

export type { userApi };
