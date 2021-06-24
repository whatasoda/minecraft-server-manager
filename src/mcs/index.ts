/* eslint-disable no-console */
import express from 'express';
import defineExpressEndpoint from '../shared/expressEndpoint';
import withDevAuth from './dev-auth';
import { logFile, makeDispatch, makeStream } from './make';

// align path with `server`'s format
interface Requests {
  '/make-dispatch/:target': {};
}
const mcsInstanceApis = defineExpressEndpoint.many<Requests>()({
  '/make-dispatch/:target': async (params, req) => {
    const { target } = params;
    await makeDispatch(target!, req);
    return { message: 'success' };
  },
});

const createServer = async () => {
  const app = express();

  const devAuth = await withDevAuth();
  if (devAuth) {
    app.use(devAuth);
  }

  app.use(express.json());
  mcsInstanceApis['/make-dispatch/:target'](app, 'post');

  app.get('/log/:target', (req, res) => {
    const { target } = req.params;
    res.sendFile(logFile(target));
  });

  app.get('/make-stream/:target', (req, res) => {
    const { target } = req.params;
    try {
      makeStream(res, target, req.query as Record<string, string>);
    } catch (e) {
      console.log(e);
      res.status(500).send('Internal Server Error');
    }
  });

  return app;
};

createServer().then((app) => {
  app.listen(8000, 'localhost', () => {
    console.log('Agent server running at localhost:8000');
  });
});

export type { mcsInstanceApis };
