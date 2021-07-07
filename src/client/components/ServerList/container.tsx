import React from 'react';
import useServerList from './useServerList';
import ServerListUI from './ui';

interface ServerListProps {}

export interface ServerListUIProps {
  servers: Meteora.InstanceInfo[];
  mayHaveNextItems: boolean;
  keyPrefix: string;
  refresh: () => void;
  onScrollEnd: () => void;
}

export default function ServerList(_props: ServerListProps) {
  const { servers, loadMoreServers, refreshServers, refreshCount } = useServerList();

  return (
    <ServerListUI
      servers={servers}
      mayHaveNextItems={false}
      keyPrefix={`${refreshCount}`}
      refresh={refreshServers}
      onScrollEnd={loadMoreServers}
    />
  );
}
