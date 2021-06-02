declare global {
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
      status: Minecraft.MachineStatus;
      machineType: string;
      localIP: string;
      globalIP?: string;
      diskSize: string;
      javaMemorySize: string;
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
