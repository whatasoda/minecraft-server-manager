import React from 'react';
import { Card, H3, Menu, MenuItem } from '@blueprintjs/core';
import { Button } from '../_fragments/blueprint/buttons';
import { ServerSummaryUIProps } from './container';
import { Popover2 } from '@blueprintjs/popover2';

// https://cloud.google.com/compute/docs/machine-types#predefined_machine_types

export default function ServerSummaryUI({ machineControl }: ServerSummaryUIProps) {
  return (
    <Card>
      <H3>{machineControl.info?.name}</H3>
      status: {machineControl.info?.status}
      <br />
      {machineControl.info?.diskSize}Gb
      <br />
      {machineControl.info?.javaMemorySize}Gb
      <br />
      IP: {machineControl.info?.globalIP || '-'}
      <Button
        icon="refresh"
        disabled={!machineControl.canRefreshInfo}
        onClick={() => {
          machineControl.refreshInfo();
        }}
      />
      <Popover2
        position="right"
        interactionKind="click"
        modifiers={{
          arrow: { enabled: true },
          preventOverflow: { enabled: true },
        }}
        content={
          <Menu>
            <MenuItem
              icon="play"
              text="Start Machine"
              disabled={!machineControl.canStartMachine}
              onClick={() => {
                machineControl.startMachine();
              }}
            />
            <MenuItem
              icon="stop"
              text="Stop Machine"
              disabled={!machineControl.canStopMachine}
              onClick={() => {
                machineControl.stopMachine();
              }}
            />
            <MenuItem
              icon="trash"
              text="Delete Machine"
              disabled={!machineControl.canDeleteMachine}
              onClick={() => {
                machineControl.deleteMachine();
              }}
            />
          </Menu>
        }
      >
        <Button icon="more" />
      </Popover2>
    </Card>
  );
}
