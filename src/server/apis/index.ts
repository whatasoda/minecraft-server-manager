import Compute from '@google-cloud/compute';
import express from 'express';
import auth from './auth';
import mcs from './mcs';
import user from './user';
import { PROJECT_ID } from '../constants';

declare global {
  namespace Endpoints {
    interface Extra {
      compute?: Compute;
    }
  }
}
global.createRequestExtra = (req) => {
  if (req.authClient) {
    return {
      compute: new Compute({ projectId: PROJECT_ID, authClient: req.authClient }),
    };
  } else {
    return {};
  }
};

const api = express();
export default api;

api.use('/auth', auth);
api.use('/mcs', mcs);
api.use('/user', user);

api.use((_, res) => {
  res.status(404).send('Not Found');
});
