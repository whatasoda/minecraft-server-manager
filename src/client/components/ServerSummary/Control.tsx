import { Menu, MenuItem } from '@blueprintjs/core';
import React from 'react';
import { useServices } from '../../contexts/services';
import containerHook from '../../utils/containerHook';
import core from './core';

interface ControlProps {
  isLoading: boolean;
  isProcessing: boolean;
  setProcessing: (processing: boolean) => void;
  setDeleted: (deleted: boolean) => void;
  refresh: () => Promise<void>;
}

const { useCoreState } = core;

const useContainer = containerHook(({ isLoading, isProcessing, setProcessing, setDeleted, refresh }: ControlProps) => {
  const { name, instance } = useCoreState();
  const { mcs } = useServices();

  const status = instance?.status;
  const canSubmit = !(isLoading || isProcessing);

  const canStartInstance = canSubmit && status === 'TERMINATED';
  const canStopInstance = canSubmit && status === 'RUNNING';
  const canDeleteInstance = canSubmit && status === 'TERMINATED';
  const canStartMinecraft = canSubmit && status === 'RUNNING';
  const canStopMinecraft = canSubmit && status === 'RUNNING';
  const canSaveMinecraftData = canSubmit && status === 'RUNNING';

  const startInstance = async () => {
    if (canSubmit) {
      setProcessing(true);
      const result = await mcs.start({ instance: name });
      if (result.error === null) {
        await refresh();
      }
      setProcessing(false);
    }
  };

  const stopInstance = async () => {
    if (canSubmit) {
      setProcessing(true);
      const result = await mcs.stop({ instance: name });
      if (result.error === null) {
        await refresh();
      }
      setProcessing(false);
    }
  };

  const deleteInstance = async () => {
    if (canSubmit) {
      setProcessing(true);
      const result = await mcs.delete({ instance: name });
      if (result.error === null) {
        setDeleted(true);
      }
      setProcessing(false);
    }
  };

  const startMinecraft = async () => {
    if (canSubmit) {
      setProcessing(true);
      const result = await mcs.dispatch({
        instance: name,
        target: 'start-server',
        params: {},
      });
      if (result.error === null) {
        await refresh();
      }
      setProcessing(false);
    }
  };

  const stopMinecraft = async () => {
    if (canSubmit) {
      setProcessing(true);
      const result = await mcs.dispatch({
        instance: name,
        target: 'stop-server',
        params: {},
      });
      if (result.error === null) {
        await refresh();
      }
      setProcessing(false);
    }
  };

  const saveMinecraftData = async () => {
    if (canSubmit) {
      setProcessing(true);
      const result = await mcs.dispatch({
        instance: name,
        target: 'backup-server',
        params: {},
      });
      if (result.error === null) {
        await refresh();
      }
      setProcessing(false);
    }
  };

  return {
    canStartInstance,
    canStopInstance,
    canDeleteInstance,
    canStartMinecraft,
    canStopMinecraft,
    canSaveMinecraftData,
    startInstance,
    stopInstance,
    deleteInstance,
    startMinecraft,
    stopMinecraft,
    saveMinecraftData,
  };
});

export default function Control(props: ControlProps) {
  const {
    canStartInstance,
    canStopInstance,
    canDeleteInstance,
    canStartMinecraft,
    canStopMinecraft,
    canSaveMinecraftData,
    startInstance,
    stopInstance,
    deleteInstance,
    startMinecraft,
    stopMinecraft,
    saveMinecraftData,
  } = useContainer(props);

  return (
    <Menu>
      <MenuItem
        icon="play"
        text="Start Server"
        disabled={!canStartInstance}
        onClick={() => {
          startInstance();
        }}
      />
      <MenuItem
        icon="play"
        text="Open Server"
        disabled={!canStartMinecraft}
        onClick={() => {
          startMinecraft();
        }}
      />
      <MenuItem
        icon="stop"
        text="Close Server"
        disabled={!canStopMinecraft}
        onClick={() => {
          stopMinecraft();
        }}
      />
      <MenuItem
        icon="stop"
        text="Save Data"
        disabled={!canSaveMinecraftData}
        onClick={() => {
          saveMinecraftData();
        }}
      />
      <MenuItem
        icon="stop"
        text="Stop Server"
        disabled={!canStopInstance}
        onClick={() => {
          stopInstance();
        }}
      />
      <MenuItem
        icon="trash"
        text="Delete Server"
        disabled={!canDeleteInstance}
        onClick={() => {
          deleteInstance();
        }}
      />
    </Menu>
  );
}
