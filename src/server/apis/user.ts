import express from 'express';
import defineExpressEndpoint from '../../shared/expressEndpoint';
import { withAuth } from './auth';

const user = express().use(withAuth());
export default user;

interface Requests {
  '/profile': {};
}
const userApi = defineExpressEndpoint.many<Requests>()({
  '/profile': async (_params, _req) => {
    return {};
  },
});

userApi['/profile'](user, 'get');

export type { userApi };
