import type { protos } from '@google-cloud/compute';
import type { StatusResponse } from 'minecraft-server-util/dist/model/StatusResponse';

declare global {
  namespace Meteora {
    export type InstanceStatus = NonNullable<protos.google.cloud.compute.v1.IInstance['status']>;

    export interface ServerConfig {
      name: string;
      machineType: string;
      diskSizeGb: number;
      javaMemorySizeGb: number;
    }

    export interface MachineTypeInfo {
      name: string;
      description: string;
      maximumPersistentDisksSizeGb: string;
      memoryGb: number;
    }

    export interface InstanceInfo {
      name: string;
      status: InstanceStatus;
      machineType: string;
      localIP: string;
      globalIP: string | null;
      diskSize: string;
      javaMemorySize: string;
    }

    export interface ServerProcessInfo {
      description: string | null;
      version: StatusResponse['version'];
      modInfo: StatusResponse['modInfo'];
      maxPlayers: StatusResponse['maxPlayers'];
      onlinePlayers: StatusResponse['onlinePlayers'];
    }

    export interface OperationInfo {
      id: string;
    }
  }
}
