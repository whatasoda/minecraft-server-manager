import React, { useCallback, useRef } from 'react';
import useServerCreationState from './useServerCreationState';
import useApiClient from '../../hooks/useApiClient';
import minecraftServerService from '../../services/minecraft-server';
import CreateServerUI from './ui';

export default function CreateServer() {
  const client = useApiClient(minecraftServerService, { createMachine: () => {} });
  const state = useServerCreationState();
  const stateRef = useRef(state);

  const { body, actions, isSizeUpdateLocked, isReadyToRequest } = (stateRef.current = state);
  const requestCreation = useCallback(async () => {
    const { body, actions, isReadyToRequest } = stateRef.current;
    if (!isReadyToRequest) {
      // TODO: toaster
      return;
    }
    const result = await client.createMachine(body);
    if (result.data) {
      // eslint-disable-next-line no-console
      console.log('hoge');
      actions.clear();
    }
  }, []);

  return (
    <CreateServerUI
      {...body}
      {...actions}
      isReadyToRequest={isReadyToRequest}
      isSizeUpdateLocked={isSizeUpdateLocked}
      machineTypeOptions={useServerCreationState.availableMachineTypeMap}
      requestCreation={requestCreation}
    />
  );
}
