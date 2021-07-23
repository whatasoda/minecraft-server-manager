import statusFE01 from 'minecraft-server-util/dist/statusFE01';

export default async function serverStatus(): Promise<Meteora.ServerProcessInfo> {
  try {
    const res = await statusFE01('localhost');
    const { description, version, modInfo, maxPlayers, onlinePlayers } = res;
    return {
      isAlive: true,
      description: description?.toString() || null,
      version,
      modInfo,
      maxPlayers,
      onlinePlayers,
    };
  } catch (e) {
    return { isAlive: false };
  }
}
