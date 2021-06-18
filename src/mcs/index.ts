/* eslint-disable no-console */
import express from 'express';
import defineExpressEndpoint from '../shared/expressEndpoint';
import { makeLogPath, makeDispatch, makeStream } from './make';

const app = express();
app.use(express.json());

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
mcsInstanceApis['/make-dispatch/:target'](app, 'post');

app.get('/log/:target', (req, res) => {
  const { target } = req.params;
  res.sendFile(makeLogPath(target));
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

app.listen(8000, 'localhost', () => {
  console.log('Agent server running at localhost:8000');
});

export type { mcsInstanceApis };
