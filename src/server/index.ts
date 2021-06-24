import express from 'express';
import session from 'express-session';
import path from 'path';
import api from './apis';
import { waitForMetadataLoad } from './constants';

const isProd = process.env.NODE_ENV === 'production';
const publicRoot = isProd ? path.resolve(__dirname, '../../public') : path.resolve(__dirname, '../../dist/public');

const app = express();

if (isProd) {
  app.set('trust proxy', 1);
}

app.use(express.json());
app.use(
  session({
    secret: 'abcde', // TODO random secret, either generated here or build step
    cookie: {
      secure: isProd,
      httpOnly: true,
    },
    resave: false,
    saveUninitialized: true,
  }),
);

app.use('/api', api);

app.use(express.static(publicRoot, { fallthrough: true }));
app.get('*', (_, res) => {
  res.sendFile(path.resolve(publicRoot, 'index.html'));
});

waitForMetadataLoad(() => {
  app.listen(8080, 'localhost', () => {
    // eslint-disable-next-line no-console
    console.log('Server started on port 8080');
  });
});
