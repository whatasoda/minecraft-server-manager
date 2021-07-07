require('minecraft-server-util')
  .statusFE01('localhost')
  .then((res) => {
    const { description, version, modInfo, maxPlayers, onlinePlayers } = res;
    /** @type {import('../types/meteora').default.ServerProcessInfo} */
    const info = {
      description: description.toString(),
      version,
      modInfo,
      maxPlayers,
      onlinePlayers,
    };
    process.stdout.write(JSON.stringify(info));
    process.exit(0);
  })
  .catch((err) => {
    process.stderr.write(JSON.stringify(err));
    process.exit(1);
  });
