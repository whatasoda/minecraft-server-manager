import React, { useCallback, useRef } from 'react';
import useServerCreationState from './useServerCreationState';
import CreateServerUI from './ui';
import { useServices } from '../../contexts/services';

export default function CreateServer() {
  const {
    minecraftServer: { createMachine },
  } = useServices();
  const state = useServerCreationState();
  const stateRef = useRef(state);

  const { body, actions, isSizeUpdateLocked, isReadyToRequest } = (stateRef.current = state);
  const requestCreation = useCallback(async () => {
    const { body, actions, isReadyToRequest } = stateRef.current;
    if (!isReadyToRequest) {
      // TODO: toaster
      return;
    }
    const result = await createMachine(body);
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
