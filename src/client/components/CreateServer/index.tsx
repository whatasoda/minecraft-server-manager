import React, { useState } from 'react';
import styled from 'styled-components';
import { Card, H3 } from '@blueprintjs/core';
import containerHook from '../../utils/containerHook';
import core from './core';
import Submit from './Submit';
import Input from './Input';
import AreaSpinner from '../_fragments/AreaSpinner';

export interface CreateServerProps {}

const { createCoreStateHOC, useCoreState } = core;

export const useContainer = containerHook((_props: CreateServerProps) => {
  const { body, actions, isSizeUpdateLocked, isReadyToRequest } = useCoreState();
  const [isProcessing, setProcessing] = useState(false);

  return {
    ...body,
    ...actions,
    isProcessing,
    isReadyToRequest,
    isSizeUpdateLocked,
    setProcessing,
  };
});

export default createCoreStateHOC(function CreateServer(props: CreateServerProps) {
  const values = useContainer(props);
  const { isProcessing, setProcessing } = values;
  return (
    <StyledCard>
      <H3>Create New Server</H3>
      <Input isProcessing={isProcessing} />
      <Submit isProcessing={isProcessing} setProcessing={setProcessing} />
      {isProcessing ? <AreaSpinner /> : null}
    </StyledCard>
  );
});

const StyledCard = styled(Card)`
  width: 300px;
`;
