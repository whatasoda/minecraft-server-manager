import type { protos } from '@google-cloud/compute';
import type { StatusResponse } from 'minecraft-server-util/dist/model/StatusResponse';

declare global {
  // https://stackoverflow.com/questions/50374908/transform-union-type-to-intersection-type#answer-50375286
  type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  namespace Minecraft {
    export type MachineStatus =
      | 'PROVISIONING'
      | 'STAGING'
      | 'RUNNING'
      | 'STOPPING'
      | 'SUSPENDING'
      | 'SUSPENDED'
      | 'REPAIRING'
      | 'TERMINATED';

    export type ServerStatus = '';
    // | 'PROVISIONING'
    // | 'STAGING'
    // | 'RUNNING'
    // | 'STOPPING'
    // | 'SUSPENDING'
    // | 'SUSPENDED'
    // | 'REPAIRING'
    // | 'TERMINATED';

    export type DataRefreshPolicy = 'WORLD' | 'DATAPACK';

    export interface MachineStatusEvent {
      status: MachineStatus;
    }

    export interface MachineInfo {
      name: string;
      status: NonNullable<protos.google.cloud.compute.v1.IInstance['status']>;
      machineType: string;
      localIP: string;
      globalIP: string | null;
      diskSize: string;
      javaMemorySize: string;
    }

    export interface ApplicationStatus {
      description: string | null;
      version: StatusResponse['version'];
      modInfo: StatusResponse['modInfo'];
      maxPlayers: StatusResponse['maxPlayers'];
      onlinePlayers: StatusResponse['onlinePlayers'];
    }

    export interface MachineType {
      name: string;
      description: string;
      maximumPersistentDisksSizeGb: string;
      memoryGb: number;
    }

    export interface MachineConfig {
      name: string;
      machineType: string;
      diskSizeGb: number;
      javaMemorySizeGb: number;
    }
  }

  type KeyValueUnion<T> = {
    [K in keyof T]-?: { key: K; value: T[K] };
  }[keyof T];
}
export {};
