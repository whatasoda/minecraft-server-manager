import createLoadingGroup from '../../utils/loadingGroup';

type LoadingKey = 'refreshInfo' | 'startMachine' | 'stopMachine' | 'deleteMachine';
export const serverSummaryLoadingGroup = createLoadingGroup<LoadingKey>('mixed');
const { bindLoadingProvider, useLoading } = serverSummaryLoadingGroup;

export interface ServerSummaryProps {
  readonly?: boolean;
  server: string | Minecraft.MachineInfo;
}

export interface ServerSummaryUIProps {
  readonly: boolean;
  machineControl: ReturnType<typeof useServerMachineControl>;
  dataRefreshPolicy: ReturnType<typeof useDataRefreshPolicy>;
}

import React from 'react';
import useServerMachineControl from './useServerMachineControl';
import useDataRefreshPolicy from './useDataRefreshPolicy';
import ServerSummaryUI from './ui';

export default bindLoadingProvider(function ServerSummary({ server = 'server', readonly }: ServerSummaryProps) {
  const { isLoading } = useLoading();
  const dataRefreshPolicy = useDataRefreshPolicy();
  const machineControl = useServerMachineControl(
    typeof server === 'string' ? server : server.name,
    typeof server === 'string' ? undefined : server,
  );

  return (
    <ServerSummaryUI
      readonly={isLoading || !!readonly}
      machineControl={machineControl}
      dataRefreshPolicy={dataRefreshPolicy}
    />
  );
});
