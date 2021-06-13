/* eslint-disable no-console */
import express from 'express';
import { makeLogPath, makeDispatch, makeStream } from './make';

const app = express();
app.use(express.json());

app.get('/log/:target', (req, res) => {
  const { target } = req.params;
  res.sendFile(makeLogPath(target));
});

app.post('/make-dispatch/:target', async (req, res) => {
  const { target } = req.params;
  try {
    await makeDispatch(target, req.body);
    res.status(200).send('Success');
  } catch (e) {
    console.log(e);
    res.status(500).send('Internal Server Error');
  }
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
