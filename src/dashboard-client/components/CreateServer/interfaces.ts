export interface CreateServerProps {
  readonly?: boolean;
}

export interface CreateServerUIProps {
  name: string;
  machineType: string | null;
  diskSizeGb: number;
  javaMemorySizeGb: number;
  machineTypeOptions: Map<string, Minecraft.MachineType>;
  isReadyToRequest: boolean;
  isSizeUpdateLocked: boolean;
  setName: (name: string) => void;
  setMachineType: (machineType: string) => void;
  setJavaMemorySizeGb: (javaMemorySizeGb: number) => void;
  setDiskSizeGb: (diskSizeGb: number) => void;
  requestCreation: () => void;
}
