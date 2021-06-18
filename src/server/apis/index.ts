import express from 'express';
import auth from './auth';
import mcs from './minecraft-server';
import user from './user';

const api = express();
export default api;

api.use('/auth', auth);
api.use('/mcs', mcs);
api.use('/user', user);

api.use((_, res) => {
  res.status(404).send('Not Found');
});
