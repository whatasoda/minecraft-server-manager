import concurrently from 'concurrently';

concurrently(
  [
    { command: 'npm run dev:d-client', name: 'd-client', prefixColor: 'cyan' },
    { command: 'npm run dev:d-server', name: 'd-server', prefixColor: 'green' },
  ],
  {
    killOthers: ['failure'],
  },
);
