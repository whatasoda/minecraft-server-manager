import React, { useEffect, useState } from 'react';
import { Button, Card, H3 } from '@blueprintjs/core';
import { Popover2 } from '@blueprintjs/popover2';
import containerHook from '../../utils/containerHook';
import { useServices } from '../../contexts/services';
import core from './core';
import Control from './Control';

export interface ServerSummaryProps {
  readonly?: boolean;
}

const { useCoreState, createCoreStateHOC } = core;

const useContainer = containerHook((props: ServerSummaryProps) => {
  const { readonly } = props;
  const { name, instance, setInstance } = useCoreState();

  const [isLoading, setLoading] = useState(false);
  const [isProcessing, setProcessing] = useState(false);
  const [isDeleted, setDeleted] = useState(false);

  const { mcs } = useServices();

  const canRefresh = !(isDeleted || isLoading);
  const refresh = async () => {
    if (canRefresh) {
      setLoading(true);
      const result = await mcs.status({ instance: name }, {});
      if (result.error === null) {
        setInstance(result.data);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!instance) {
      refresh();
    }
  }, []);

  return {
    name,
    instance,
    isLoading,
    isProcessing,
    isDeleted,
    readonly: !!readonly,
    setLoading,
    setProcessing,
    setDeleted,
    canRefresh,
    refresh,
  };
});

export default createCoreStateHOC(function ServerSummary(props: ServerSummaryProps) {
  const { name, instance, canRefresh, refresh, isLoading, isProcessing, isDeleted, setDeleted, setProcessing } =
    useContainer(props);
  return (
    <Card>
      <H3>{name}</H3>
      status: {instance?.status}
      <br />
      {instance?.diskSize}Gb
      <br />
      {instance?.javaMemorySize}Gb
      <br />
      IP: {instance?.globalIP || '-'}
      <Button
        icon="refresh"
        disabled={!canRefresh}
        onClick={() => {
          refresh();
        }}
      />
      {isDeleted ? null : (
        <Popover2
          position="right"
          interactionKind="click"
          modifiers={{
            arrow: { enabled: true },
            preventOverflow: { enabled: true },
          }}
          content={
            <Control
              refresh={refresh}
              isLoading={isLoading}
              isProcessing={isProcessing}
              setProcessing={setProcessing}
              setDeleted={setDeleted}
            />
          }
          children={<Button icon="more" />}
        />
      )}
    </Card>
  );
});
