import { Classes, InputGroup, NumericInput } from '@blueprintjs/core';
import React from 'react';
import styled from 'styled-components';
import containerHook from '../../utils/containerHook';
import InputMachineType from './InputMachineType';
import core from './core';

interface InputProps {
  isProcessing: boolean;
}
const { useCoreState } = core;

export const useContainer = containerHook((props: InputProps) => {
  const { isProcessing } = props;
  const { actions, body, isSizeUpdateLocked } = useCoreState();
  const { name, diskSizeGb, javaMemorySizeGb } = body;
  const { setName } = actions;

  const setDiskSizeGb = (value: number) => {
    actions.setDiskSizeGb(Math.floor(value));
  };
  const setJavaMemorySizeGb = (value: number) => {
    actions.setJavaMemorySizeGb(Math.floor(value));
  };

  return {
    isProcessing,
    isSizeUpdateLocked,
    name,
    diskSizeGb,
    javaMemorySizeGb,
    setName,
    setDiskSizeGb,
    setJavaMemorySizeGb,
  };
});

export default function Input(props: InputProps) {
  const {
    isProcessing,
    isSizeUpdateLocked,
    name,
    diskSizeGb,
    javaMemorySizeGb,
    setName,
    setDiskSizeGb,
    setJavaMemorySizeGb,
  } = useContainer(props);

  return (
    <>
      <FieldLabel>
        <span>Name:</span>
        <InputGroup
          value={name}
          disabled={isProcessing}
          onChange={(event) => {
            setName(event.currentTarget.value);
          }}
        />
      </FieldLabel>
      <FieldLabel>
        <span>Spec:</span>
        <InputMachineType isProcessing={isProcessing} />
      </FieldLabel>
      <FieldLabel>
        <span>Java Memory Size:</span>
        <StyledNumericInput
          value={javaMemorySizeGb}
          unit="Gb"
          minorStepSize={null}
          min={0}
          disabled={isSizeUpdateLocked}
          allowNumericCharactersOnly
          onValueChange={(value) => {
            setJavaMemorySizeGb(value);
          }}
        />
      </FieldLabel>
      <FieldLabel>
        <span>Disk Size:</span>
        <StyledNumericInput
          value={diskSizeGb}
          unit="Gb"
          minorStepSize={null}
          min={0}
          disabled={isProcessing || isSizeUpdateLocked}
          allowNumericCharactersOnly
          onValueChange={(value) => {
            setDiskSizeGb(value);
          }}
        />
      </FieldLabel>
    </>
  );
}

const FieldLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  > span {
    display: block;
    margin-bottom: 4px;
  }
`;

const StyledNumericInput = styled(NumericInput)<{ unit?: string }>`
  .${Classes.INPUT_GROUP} {
    width: 90px;
  }
  &::after {
    content: '${({ unit }) => unit}';
    display: block;
    align-self: center;
    margin-left: 8px;
  }
`;
