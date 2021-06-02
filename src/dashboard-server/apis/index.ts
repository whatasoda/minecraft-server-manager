import express from 'express';
import auth from './auth';
import minecraftServer from './minecraft-server';
import user from './user';

const api = express();
export default api;

api.use('/auth', auth);
api.use('/minecraft-server', minecraftServer);
api.use('/user', user);

api.use((_, res) => {
  res.status(404).send('Not Found');
});
