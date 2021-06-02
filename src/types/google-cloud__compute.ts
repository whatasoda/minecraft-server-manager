declare module '@google-cloud/compute' {
  import common from '@google-cloud/common';
  export interface ClientConfig extends Partial<common.ServiceConfig> {
    projectId?: string;
  }

  class Compute extends common.Service {
    constructor(options: ClientConfig);
    zone(name: string): Zone;
  }
  export class Zone extends common.ServiceObject<Zone> {
    vm(name: string): VM;
    getVMs(options: { pageToken?: string }): Promise<[vms: VM[], pageToken: string | undefined, apiResponse: {}]>;
    getMachineTypes(options: { autoPaginate?: boolean }): Promise<[MachineType[]]>;
  }
  export class VM extends common.ServiceObject<VM> {
    // delete(): Promise<[Operation, {}]>;
    start(): Promise<[Operation, {}]>;
    stop(): Promise<[Operation, {}]>;
  }

  export interface MachineType {
    id: string;
    creationTimestamp: string;
    name: string;
    description: string;
    guestCpus: number;
    memoryMb: number;
    imageSpaceGb: number;
    scratchDisks: { diskGb: number }[];
    maximumPersistentDisks: number;
    maximumPersistentDisksSizeGb: string;
    deprecated: { state: string; replacement: string; deprecated: string; obsolete: string; deleted: string };
    zone: string;
    selfLink: string;
    isSharedCpu: boolean;
    accelerators: { guestAcceleratorType: string; guestAcceleratorCount: number }[];
    kind: string;
  }
  export class MachineType {}

  export class Operation extends common.Operation<Operation> {}

  export default Compute;
}
