import React from 'react';
import styled from 'styled-components';
import { Button } from '@blueprintjs/core';
import toast from '../_overlays/toast';
import { useServices } from '../../contexts/services';
import containerHook from '../../utils/containerHook';
import { texts } from './constants';
import core from './core';

const { useCoreState } = core;

interface SubmitProps {
  isProcessing: boolean;
  setProcessing: (processing: boolean) => void;
}

const useContainer = containerHook(({ isProcessing, setProcessing }: SubmitProps) => {
  const { body, actions, isReadyToRequest } = useCoreState();
  const { mcs } = useServices();

  const requestCreation = async () => {
    if (!isReadyToRequest) {
      toast.warning('Something missed with your input to request machine creation');
      return;
    }
    if (isProcessing) {
      toast.warning('Machine creation already requested');
      return;
    }
    setProcessing(true);
    const result = await mcs.create(body);
    setProcessing(false);
    if (result.data) {
      actions.clear();
    }
  };

  return { isReadyToRequest, requestCreation };
});

export default function Submit(props: SubmitProps) {
  const { isReadyToRequest, requestCreation } = useContainer(props);
  return (
    <ButtonWrapper>
      <Button
        disabled={!isReadyToRequest}
        intent="primary"
        text={texts.submit}
        onClick={() => {
          requestCreation();
        }}
      />
    </ButtonWrapper>
  );
}

const ButtonWrapper = styled.div`
  text-align: right;
`;
