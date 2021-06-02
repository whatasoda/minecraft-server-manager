import Compute from '@google-cloud/compute';
import express, { Request, Response } from 'express';
import { withAuth } from './auth';
import {
  createInstance,
  deleteInstance,
  getInstance,
  listInstances,
  listMachineTypes,
  startInstance,
  stopInstance,
} from '../services/compute';
import { Result } from '../utils/result';

declare global {
  namespace Dashboard {
    namespace MinecraftServer {
      interface GetReq$ListMachines {
        pageToken?: string;
      }
      type GetRes$ListMachines = Result<{ machines: Minecraft.MachineInfo[]; nextQuery: string }>;

      interface GetReq$ListMachineTypes {}
      type GetRes$ListMachineTypes = Result<{ machineTypes: Minecraft.MachineType[] }>;

      interface PostReq$CreateMachine extends Minecraft.MachineConfig {
        name: string;
        machineType: string;
        diskSizeGb: number;
        javaMemorySizeGb: number;
      }
      type PostRes$CreateMachine = Result<{ message: string }>;

      interface PostReq$StartMachine {
        name: string;
      }
      type PostRes$StartMachine = Result<{ message: string }>;

      interface PostReq$StopMachine {
        name: string;
      }
      type PostRes$StopMachine = Result<{ message: string }>;

      interface PostReq$DeleteMachine {
        name: string;
      }
      type PostRes$DeleteMachine = Result<{ message: string }>;

      interface GetReq$Status {
        name: string;
      }
      type GetRes$Status = Result<{ machine: Minecraft.MachineInfo }>;

      interface PostReq$Start {
        name: string;
      }
      interface PostRes$Start {
        message: string;
      }

      interface PostReq$Stop {
        name: string;
      }
      interface PostRes$Stop {
        message: string;
      }

      interface PostReq$Save {
        name: string;
      }
      interface PostReq$RefreshData {
        name: string;
        policy: Minecraft.DataRefreshPolicy;
      }
      interface GetReq$List {}
      interface PostReq$Command {
        name: string;
      }
      interface GetReq$Log {
        name: string;
      }
      interface GetReq$LogEvents {
        name: string;
      }
    }
  }
}

import Decls = Dashboard.MinecraftServer;

const jsonResponse = async <T>(res: Response, impl: () => T | Promise<T>) => {
  try {
    const result = await impl();
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json('Internal Server Error');
  }
};

const authCompute = (req: Request) => {
  return new Compute({ projectId: 'whatasoda-mc-server', authClient: req.authClient });
};

const minecraftServer = express().use(withAuth());
export default minecraftServer;

minecraftServer.get('/list-machines', async (req, res) => {
  jsonResponse<Decls.GetRes$ListMachines>(res, async () => {
    const compute = authCompute(req);
    const { pageToken }: Decls.GetReq$ListMachines = req.query;
    const result = await listInstances(compute, pageToken);
    if (result.data) {
      return { error: null, data: { machines: result.data.instances, nextQuery: result.data.nextQuery } };
    } else {
      return { error: result.error, data: null } as any;
    }
  });
});
minecraftServer.post('/list-machine-types', async (req, res) => {
  jsonResponse<Decls.GetRes$ListMachineTypes>(res, async () => {
    const compute = authCompute(req);
    // const {}: Decls.GetReq$ListMachineTypes = req.body;
    const result = await listMachineTypes(compute);
    return result;
  });
});
minecraftServer.post('/create-machine', async (req, res) => {
  jsonResponse<Decls.PostRes$CreateMachine>(res, async () => {
    const compute = authCompute(req);
    const { name, machineType, diskSizeGb, javaMemorySizeGb }: Decls.PostReq$CreateMachine = req.body;
    const result = await createInstance(compute, name, { machineType, diskSizeGb, javaMemorySizeGb });
    return result;
  });
});
minecraftServer.post('/start-machine', async (req, res) => {
  jsonResponse<Decls.PostRes$StartMachine>(res, async () => {
    const compute = authCompute(req);
    const { name }: Decls.PostReq$StartMachine = req.body;
    const result = await startInstance(compute, name);
    return result;
  });
});
minecraftServer.post('/stop-machine', async (req, res) => {
  jsonResponse<Decls.PostRes$StopMachine>(res, async () => {
    const compute = authCompute(req);
    const { name }: Decls.PostReq$StopMachine = req.body;
    const result = await stopInstance(compute, name);
    return result;
  });
});
minecraftServer.post('/delete-machine', async (req, res) => {
  jsonResponse<Decls.PostRes$DeleteMachine>(res, async () => {
    const compute = authCompute(req);
    const { name }: Decls.PostReq$DeleteMachine = req.body;
    const result = await deleteInstance(compute, name);
    return result;
  });
});
minecraftServer.get('/status', async (req, res) => {
  jsonResponse<Decls.GetRes$Status>(res, async () => {
    const compute = authCompute(req);
    const { name }: Decls.GetReq$Status = req.query as any;
    const instance = await getInstance(compute, name);
    if (!instance.data) {
      return Result.error(instance.error);
    }
    // const { localIP } = instance.data;
    // TODO: fetch server
    return Result.ok({ machine: instance.data });
  });
});

minecraftServer.post('/start');
minecraftServer.post('/stop');
minecraftServer.post('/save');
minecraftServer.post('/refresh-data');
// minecraftServer.get('/status-events');
minecraftServer.get('/list');
minecraftServer.post('/command');
minecraftServer.get('/log');
minecraftServer.get('/log-events');
