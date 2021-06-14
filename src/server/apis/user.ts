import express from 'express';
import { withAuth } from './auth';

const user = express();
export default user;

user.use(withAuth());

user.get('/profile', (_, res) => {
  res.status(200).json({ data: {} });
});
