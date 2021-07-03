/* eslint-disable no-console */
import express from 'express';
import fs from 'fs';
import withMcsAuth from './mcs-auth';
import { makeDispatch } from './make';
import createRequestHandlers from '../shared/requestHandlerFactory';
import { defaultAdapter } from '../shared/defaultRequestAdapter';
import sliceLine from './slice-line';

const app = express();

app.use(withMcsAuth());
app.use(express.json());

export interface McsHandlers {
  '/log': [
    {
      instance: string;
      target: string;
      stride: number;
      cursor?: number;
    },
    ReturnType<typeof sliceLine>,
  ];
  '/status': [{}, {}];
  '/make': [
    {
      instance: string;
      target: string;
      params: {};
    },
    {},
  ];
}

createRequestHandlers<McsHandlers>({
  '/log': async (body) => {
    const { target, stride, cursor } = body;
    const raw = await fs.promises.readFile(`make-${target}.log`, 'utf-8');
    return sliceLine(raw, stride, cursor);
  },
  '/status': async () => {
    return {};
  },
  '/make': async (body) => {
    const { target, params } = body;
    await makeDispatch(target!, params);
    return {};
  },
}).forEach((endpoint) => {
  switch (endpoint.path) {
    case '/log':
      app.get(endpoint.path, endpoint.factory(defaultAdapter));
      break;
    case '/make':
      app.post(endpoint.path, endpoint.factory(defaultAdapter));
      break;
  }
});

app.listen(8000, 'localhost', () => {
  console.log('Agent server running at localhost:8000');
});
