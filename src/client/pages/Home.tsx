import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import ServerList from '../components/ServerList';

export default function Home(_props: RouteComponentProps) {
  return (
    <>
      <ServerList />
    </>
  );
}
