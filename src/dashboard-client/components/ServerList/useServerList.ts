import { useCallback, useEffect, useRef, useState } from 'react';
import { useServices } from '../../contexts/services';

export default function useServerList() {
  const [list, setList] = useState<Minecraft.MachineInfo[]>([]);
  const pageToken = useRef<string>();
  const refreshCount = useRef<number>(0);
  const {
    minecraftServer: { listMachines },
  } = useServices();

  const loadMoreServers = useCallback(async () => {
    const prevToken = pageToken.current;
    const result = await listMachines({ pageToken: prevToken });
    if (result.error === null) {
      const { machines, nextQuery } = result.data;
      pageToken.current = nextQuery;
      setList((curr) => {
        return prevToken ? [...curr, ...machines] : [...machines];
      });
    }
  }, []);

  const refreshServers = useCallback(async () => {
    refreshCount.current++;
    pageToken.current = undefined;
    await loadMoreServers();
  }, []);

  useEffect(() => {
    refreshServers();
  }, []);

  return {
    servers: list,
    refreshCount: refreshCount.current,
    refreshServers,
    loadMoreServers,
  };
}
