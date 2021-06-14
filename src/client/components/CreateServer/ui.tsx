import React from 'react';
import styled from 'styled-components';
import { Classes, H3, OptionProps } from '@blueprintjs/core';
import { CreateServerUIProps } from './container';
import Card from '../_fragments/blueprint/Card';
import { InputGroup, HTMLSelect, NumericInput } from '../_fragments/blueprint/inputs';
import { Button } from '../_fragments/blueprint/buttons';

const texts = {
  emptyOption: 'Choose Machine Type...',
  submit: 'Create',
};

export default function CreateServerUI(props: CreateServerUIProps) {
  const { isLoading } = props;
  return (
    <StyledCard loading={isLoading}>
      <H3>Create New Server</H3>
      <StyledFieldLabel>
        <span>Name:</span>
        {renderNameInput()}
      </StyledFieldLabel>
      <StyledFieldLabel>
        <span>Spec:</span>
        {renderMachineTypeSelect()}
      </StyledFieldLabel>
      <StyledFieldLabel>
        <span>Java Memory Size:</span>
        {renderJavaMemorySizeInput()}
      </StyledFieldLabel>
      <StyledFieldLabel>
        <span>Disk Size:</span>
        {renderDiskSizeInput()}
      </StyledFieldLabel>
      <StyledButtonWrapper>{renderSubmitButton()}</StyledButtonWrapper>
    </StyledCard>
  );

  function renderNameInput() {
    const { name, setName } = props;
    return (
      <InputGroup
        value={name}
        onChange={(event) => {
          setName(event.currentTarget.value);
        }}
      />
    );
  }
  function renderMachineTypeSelect() {
    const { machineType, machineTypeOptions, setMachineType } = props;
    const options: OptionProps[] = [{ value: '', label: texts.emptyOption }];
    machineTypeOptions.forEach(({ name, description }) => {
      options.push({
        value: name,
        label: `${name} - ${description}`,
      });
    });
    return (
      <HTMLSelect
        value={machineType || ''}
        options={options}
        onChange={(event) => {
          setMachineType(event.currentTarget.value || '');
        }}
      />
    );
  }
  function renderJavaMemorySizeInput() {
    const { javaMemorySizeGb, setJavaMemorySizeGb, isSizeUpdateLocked } = props;
    return (
      <StyledNumericInput
        value={javaMemorySizeGb}
        unit="Gb"
        minorStepSize={null}
        min={0}
        disabled={isSizeUpdateLocked}
        allowNumericCharactersOnly
        onValueChange={(value) => {
          setJavaMemorySizeGb(Math.floor(value));
        }}
      />
    );
  }
  function renderDiskSizeInput() {
    const { diskSizeGb, setDiskSizeGb, isSizeUpdateLocked } = props;
    return (
      <StyledNumericInput
        value={diskSizeGb}
        unit="Gb"
        minorStepSize={null}
        min={0}
        disabled={isSizeUpdateLocked}
        allowNumericCharactersOnly
        onValueChange={(value) => {
          setDiskSizeGb(Math.floor(value));
        }}
      />
    );
  }
  function renderSubmitButton() {
    const { isReadyToRequest, requestCreation } = props;
    return (
      <Button
        disabled={!isReadyToRequest}
        intent="primary"
        text={texts.submit}
        onClick={() => {
          requestCreation();
        }}
      />
    );
  }
}

const StyledCard = styled(Card)`
  width: 300px;
`;

const StyledFieldLabel = styled.label`
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

const StyledButtonWrapper = styled.div`
  text-align: right;
`;
