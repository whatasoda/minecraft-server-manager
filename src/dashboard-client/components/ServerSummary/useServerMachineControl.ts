import { useEffect, useState } from 'react';
import { useServices } from '../../contexts/services';
import { serverSummaryLoadingGroup } from './container';

const { useLoading } = serverSummaryLoadingGroup;

export default function useServerMachineControl(name: string, machineInfo?: Minecraft.MachineInfo) {
  const [isDeleted, setIsDeleted] = useState(false);
  const [info, setInfo] = useState(machineInfo || null);
  const { minecraftServer: client } = useServices();

  const { isLoading, setLoading } = useLoading();

  const canRefreshInfo = !isDeleted || !isLoading;
  const refreshInfo = async () => {
    if (canRefreshInfo) {
      setLoading('refreshInfo', true);
      const result = await client.status({ name });
      if (result.error === null) {
        setInfo(result.data.machine);
      }
      setLoading('refreshInfo', false);
    }
  };

  const canStartMachine = !isLoading && info?.status === 'TERMINATED';
  const startMachine = async () => {
    if (canStartMachine) {
      setLoading('startMachine', true);
      const result = await client.startMachine({ name });
      if (result.error === null) {
        await refreshInfo();
      }
      setLoading('startMachine', false);
    }
  };

  const canStopMachine = !isLoading && info?.status === 'RUNNING';
  const stopMachine = async () => {
    if (canStopMachine) {
      setLoading('stopMachine', true);
      const result = await client.stopMachine({ name });
      if (result.error === null) {
        await refreshInfo();
      }
      setLoading('stopMachine', false);
    }
  };

  const canDeleteMachine = !isLoading && info?.status === 'TERMINATED';
  const deleteMachine = async () => {
    if (canDeleteMachine) {
      setLoading('deleteMachine', true);
      const result = await client.deleteMachine({ name });
      if (result.error === null) {
        setIsDeleted(true);
      }
      setLoading('deleteMachine', false);
    }
  };

  useEffect(() => {
    if (info) return;
    refreshInfo();
  }, []);

  return {
    info,
    isDeleted,
    canRefreshInfo,
    canStartMachine,
    canStopMachine,
    canDeleteMachine,
    refreshInfo,
    startMachine,
    stopMachine,
    deleteMachine,
  };
}
