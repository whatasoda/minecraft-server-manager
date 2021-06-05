import React from 'react';
import { Button, Card, H3, HTMLSelect, InputGroup, NumericInput, OptionProps } from '@blueprintjs/core';
import { CreateServerUIProps } from './interfaces';

const texts = {
  emptyOption: 'Choose Machine Type...',
  submit: 'Create',
};

export default function CreateServerUI(props: CreateServerUIProps) {
  // const { machineTypeOptions, machineType } = props;
  // const selectedMachineType = machineTypeOptions.get(machineType || '');
  return (
    <Card>
      <H3>Create New Server</H3>
      {renderNameInput()}
      {renderMachineTypeSelect()}
      {renderJavaMemorySizeInput()}
      {renderDiskSizeInput()}
      {renderSubmitButton()}
    </Card>
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
      <NumericInput
        value={javaMemorySizeGb}
        minorStepSize={null}
        min={0}
        disabled={isSizeUpdateLocked}
        onValueChange={(value) => {
          setJavaMemorySizeGb(Math.floor(value));
        }}
      />
    );
  }
  function renderDiskSizeInput() {
    const { diskSizeGb, setDiskSizeGb, isSizeUpdateLocked } = props;
    return (
      <NumericInput
        value={diskSizeGb}
        minorStepSize={null}
        min={0}
        disabled={isSizeUpdateLocked}
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
        text={texts.submit}
        onClick={() => {
          requestCreation();
        }}
      />
    );
  }
}
