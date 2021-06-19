import React from 'react';
import { HTMLSelect, OptionProps } from '@blueprintjs/core';
import containerHook from '../../utils/containerHook';
import core from './core';
import { machineTypes, texts } from './constants';

interface InputMachineTypeProps {
  isProcessing: boolean;
}
const { useCoreState } = core;

export const useContainer = containerHook((props: InputMachineTypeProps) => {
  const { isProcessing } = props;
  const { actions, body } = useCoreState();
  const { machineType } = body;
  const { setMachineType } = actions;

  const options: OptionProps[] = [{ value: '', label: texts.emptyOption }];
  machineTypes.forEach(({ name, description }) => {
    options.push({
      value: name,
      label: `${name} - ${description}`,
    });
  });

  return { isProcessing, machineType, setMachineType, options };
});

export default function InputMachineType(props: InputMachineTypeProps) {
  const { isProcessing, machineType, setMachineType, options } = useContainer(props);
  return (
    <HTMLSelect
      disabled={isProcessing}
      value={machineType || ''}
      options={options}
      onChange={(event) => {
        setMachineType(event.currentTarget.value || '');
      }}
    />
  );
}
