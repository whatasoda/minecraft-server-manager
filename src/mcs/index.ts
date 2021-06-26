/* eslint-disable no-console */
import express from 'express';
import withMcsAuth from './mcs-auth';
import { logFile, makeDispatch, makeStream } from './make';
import createRequestHandlers from '../shared/requestHandlerFactory';
import { defaultAdapter } from '../shared/defaultRequestAdapter';

export interface McsHandlers {
  '/make-dispatch': [
    {
      instance: string;
      target: string;
      params: {};
    },
    {},
  ];
}

const handlers = createRequestHandlers<McsHandlers>({
  '/make-dispatch': async (body) => {
    const { target, params } = body;
    await makeDispatch(target!, params);
    return {};
  },
});

const createServer = async () => {
  const app = express();

  app.use(await withMcsAuth());
  app.use(express.json());

  handlers.forEach((endpoint) => {
    switch (endpoint.path) {
      case '/make-dispatch':
        app.post(endpoint.path, endpoint.factory(defaultAdapter));
        break;
    }
  });

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
