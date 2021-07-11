export const machineTypes: Meteora.MachineTypeInfo[] = [
  {
    name: 'n2-standard-2',
    description: '2 vCPUs 8 GB RAM',
    memoryGb: 8,
    maximumPersistentDisksSizeGb: '263168',
  },
  {
    name: 'n2-standard-4',
    description: '4 vCPUs 16 GB RAM',
    memoryGb: 16,
    maximumPersistentDisksSizeGb: '263168',
  },
  {
    name: 'n2-standard-8',
    description: '8 vCPUs 32 GB RAM',
    memoryGb: 32,
    maximumPersistentDisksSizeGb: '263168',
  },
  {
    name: 'n2-standard-16',
    description: '16 vCPUs 64 GB RAM',
    memoryGb: 64,
    maximumPersistentDisksSizeGb: '263168',
  },
  {
    name: 'n2-standard-32',
    description: '32 vCPUs 128 GB RAM',
    memoryGb: 128,
    maximumPersistentDisksSizeGb: '263168',
  },
  {
    name: 'n2-standard-48',
    description: '48 vCPUs 192 GB RAM',
    memoryGb: 192,
    maximumPersistentDisksSizeGb: '263168',
  },
  {
    name: 'n2-standard-64',
    description: '64 vCPUs 256 GB RAM',
    memoryGb: 256,
    maximumPersistentDisksSizeGb: '263168',
  },
  {
    name: 'n2-standard-80',
    description: '80 vCPUs 320 GB RAM',
    memoryGb: 320,
    maximumPersistentDisksSizeGb: '263168',
  },
];
export const machineTypeMap = new Map(machineTypes.map((machineType) => [machineType.name, machineType]));
