require('minecraft-server-util')
  .statusFE01('localhost')
  .then((res) => {
    process.stdout.write(JSON.stringify(res));
    process.exit(0);
  })
  .catch((err) => {
    process.stderr.write(JSON.stringify(err));
    process.exit(1);
  });
