import concurrently from 'concurrently';

concurrently(
  [
    { command: 'npm run dev:client', name: 'client', prefixColor: 'cyan' },
    { command: 'npm run dev:server', name: 'server', prefixColor: 'green' },
  ],
  {
    killOthers: ['failure'],
  },
);
