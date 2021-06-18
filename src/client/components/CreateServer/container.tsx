import React, { useCallback, useRef } from 'react';
import useServerCreationState from './useServerCreationState';
import CreateServerUI from './ui';
import { useServices } from '../../contexts/services';
import useLoading from '../../hooks/useLoading';
import toast from '../_overlays/toast';

export interface CreateServerProps {}

export interface CreateServerUIProps {
  name: string;
  machineType: string | null;
  diskSizeGb: number;
  javaMemorySizeGb: number;
  machineTypeOptions: Map<string, Minecraft.MachineType>;
  isLoading: boolean;
  isReadyToRequest: boolean;
  isSizeUpdateLocked: boolean;
  setName: (name: string) => void;
  setMachineType: (machineType: string) => void;
  setJavaMemorySizeGb: (javaMemorySizeGb: number) => void;
  setDiskSizeGb: (diskSizeGb: number) => void;
  requestCreation: () => void;
}

export default function CreateServer(_props: CreateServerProps) {
  const { mcs } = useServices();
  const serverCreationState = useServerCreationState();
  const { isLoadingSome, setLoading } = useLoading<'create'>('mixed');
  const state = {
    ...serverCreationState,
    isLoading: isLoadingSome,
  };
  const stateRef = useRef(state);
  stateRef.current = state;

  const { body, actions, isSizeUpdateLocked, isReadyToRequest, isLoading } = state;
  const requestCreation = useCallback(async () => {
    const { body, actions, isReadyToRequest, isLoading } = stateRef.current;
    if (!isReadyToRequest) {
      toast.warning('Something missed with your input to request machine creation');
      return;
    }
    if (isLoading) {
      toast.warning('Machine creation already requested');
      return;
    }
    setLoading('create', true);
    const result = await mcs.create({}, body);
    setLoading('create', false);
    if (result.data) {
      actions.clear();
    }
  }, []);

  return (
    <CreateServerUI
      {...body}
      {...actions}
      isLoading={isLoading}
      isReadyToRequest={isReadyToRequest}
      isSizeUpdateLocked={isSizeUpdateLocked}
      machineTypeOptions={useServerCreationState.availableMachineTypeMap}
      requestCreation={requestCreation}
    />
  );
}
