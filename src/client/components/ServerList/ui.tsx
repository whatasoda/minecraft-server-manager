import { Button, Card } from '@blueprintjs/core';
import { Popover2 } from '@blueprintjs/popover2';
import React from 'react';
import styled from 'styled-components';
import CreateServer from '../CreateServer';
import ServerSummary from '../ServerSummary';
import { ServerListUIProps } from './container';

export default function ServerListUI({ servers, refresh }: ServerListUIProps) {
  return (
    <StyledCard>
      <Button
        icon="refresh"
        onClick={() => {
          refresh();
        }}
      />
      <Popover2 content={<CreateServer />}>
        <Button
          icon="plus"
          onClick={() => {
            refresh();
          }}
        />
      </Popover2>
      <hr />
      <StyledScrollArea>{renderServers()}</StyledScrollArea>
    </StyledCard>
  );

  function renderServers() {
    return servers.map((server, idx) => {
      return <ServerSummary key={server.name || idx} instance={server} />;
    });
  }
}

const StyledCard = styled(Card)`
  height: 80vh;
`;

const StyledScrollArea = styled.div`
  display: flex;
  flex-direction: column;
  > * {
    margin-bottom: 20px;
  }
`;
