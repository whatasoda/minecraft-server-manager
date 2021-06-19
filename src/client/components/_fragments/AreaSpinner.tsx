import { Spinner } from '@blueprintjs/core';
import React from 'react';
import styled from 'styled-components';

export default function AreaSpinner() {
  return (
    <SpinnerWrapper>
      <Spinner intent="primary" size={60} />
    </SpinnerWrapper>
  );
}

const SpinnerWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff8;
`;
