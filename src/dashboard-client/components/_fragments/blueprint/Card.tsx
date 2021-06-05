import React from 'react';
import { Card as BpCard, CardProps as BpCardProps, Spinner } from '@blueprintjs/core';
import { disabledGroup } from '../groups';
import styled from 'styled-components';

interface CardProps extends BpCardProps {
  loading?: boolean;
  disabled?: boolean;
}

export default function Card({ loading, disabled, ...props }: CardProps) {
  return (
    <CustomCard {...props} disabled={loading || disabled || false}>
      {props.children}
      {renderLoading()}
    </CustomCard>
  );
  function renderLoading() {
    if (!loading) {
      return null;
    }
    return (
      <SpinnerWrapper>
        <Spinner intent="primary" size={60} />
      </SpinnerWrapper>
    );
  }
}

const CustomCard = styled(disabledGroup.createParent(BpCard))`
  position: relative;
`;

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
