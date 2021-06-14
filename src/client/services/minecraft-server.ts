const baseUrl = '/api/minecraft-server';

import { Result } from '../../dashboard-server/utils/result';
import { createUrlSearchParam } from '../utils/url';
import Decls = Dashboard.MinecraftServer;

const createGetApi = <Req, Res extends Result<any>>(url: string) => {
  return async (body: Req) => {
    try {
      const res = await fetch(`${url}?${createUrlSearchParam(body)}`, {
        method: 'GET',
      });
      return (await res.json()) as Res;
    } catch (e) {
      return Result.clientError(e);
    }
  };
};

const createPostApi = <Req, Res extends Result<any>>(url: string) => {
  return async (body: Req) => {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      return (await res.json()) as Res;
    } catch (e) {
      return Result.clientError(e);
    }
  };
};

const minecraftServerService = {
  listMachines: createGetApi<Decls.GetReq$ListMachines, Decls.GetRes$ListMachines>(`${baseUrl}/list-machines`),
  listMachineTypes: createGetApi<Decls.GetReq$ListMachineTypes, Decls.GetRes$ListMachineTypes>(
    `${baseUrl}/list-machine-types`,
  ),
  createMachine: createPostApi<Decls.PostReq$CreateMachine, Decls.PostRes$CreateMachine>(`${baseUrl}/create-machine`),
  startMachine: createPostApi<Decls.PostReq$StartMachine, Decls.PostRes$StartMachine>(`${baseUrl}/start-machine`),
  stopMachine: createPostApi<Decls.PostReq$StopMachine, Decls.PostRes$StopMachine>(`${baseUrl}/stop-machine`),
  deleteMachine: createPostApi<Decls.PostReq$DeleteMachine, Decls.PostRes$DeleteMachine>(`${baseUrl}/delete-machine`),
  status: createGetApi<Decls.GetReq$Status, Decls.GetRes$Status>(`${baseUrl}/status`),
};

export default minecraftServerService;
