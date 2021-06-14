import Compute, { Operation, VM } from '@google-cloud/compute';
import path from 'path';
import fs from 'fs-extra';
import { AsyncResult, Result } from '../utils/result';

const ZONE = 'asia-northeast1-a';
const bucketName = '';

type InstanceInfo = Minecraft.MachineInfo;
type MachineType = Minecraft.MachineType;
type InstanceConfig = Omit<Minecraft.MachineConfig, 'name'>;

const extractInstanceInfo = ({ metadata: vm }: VM): InstanceInfo => {
  const {
    name,
    machineType,
    status,
    networkInterfaces: [{ networkIP: localIP, accessConfigs: [{ natIP: globalIP }] = [{ natIP: undefined }] }],
    disks: [{ diskSizeGb: diskSize }],
  } = vm;
  const metadata = vm.metadata.items as { key: string; value: string }[];
  const { javaMemorySize } = metadata.reduce<Record<string, string>>((acc, { key, value }) => {
    acc[key] = value;
    return acc;
  }, {});

  return {
    name,
    machineType,
    status,
    localIP,
    globalIP,
    diskSize,
    javaMemorySize,
  };
};

export const listInstances = async (
  compute: Compute,
  pageToken: string | undefined,
): AsyncResult<{ instances: InstanceInfo[]; nextQuery?: string }> => {
  try {
    const zone = compute.zone(ZONE);
    const [vms, nextQuery] = await zone.getVMs({ pageToken });
    const instances = vms.map((vm) => extractInstanceInfo(vm));
    return Result.ok({ instances, nextQuery });
  } catch (e) {
    return Result.error(e);
  }
};

export const listMachineTypes = async (compute: Compute): AsyncResult<{ machineTypes: MachineType[] }> => {
  try {
    const zone = compute.zone(ZONE);
    const [res] = await zone.getMachineTypes({ autoPaginate: true });
    const machineTypes = res.map<MachineType>(({ name, description, maximumPersistentDisksSizeGb, memoryMb }) => ({
      name,
      description,
      memoryGb: memoryMb / 1024,
      maximumPersistentDisksSizeGb,
    }));
    return Result.ok({ machineTypes });
  } catch (e) {
    return Result.error(e);
  }
};

export const getInstance = async (compute: Compute, vmName: string): AsyncResult<InstanceInfo> => {
  try {
    const zone = compute.zone(ZONE);
    const vm = zone.vm(vmName);
    const [res] = await vm.get();
    return Result.ok<InstanceInfo>(extractInstanceInfo(res));
  } catch (e) {
    return Result.error(e);
  }
};

export const startInstance = async (compute: Compute, vmName: string): AsyncResult<{ message: string }> => {
  try {
    const zone = compute.zone(ZONE);
    const vm = zone.vm(vmName);
    const [operation] = await vm.start();
    await operation.promise();
    return Result.ok({ message: 'success' });
  } catch (e) {
    return Result.error(e);
  }
};

export const stopInstance = async (compute: Compute, vmName: string): AsyncResult<{ message: string }> => {
  try {
    const zone = compute.zone(ZONE);
    const vm = zone.vm(vmName);
    const [operation] = await vm.stop();
    await operation.promise();
    return Result.ok({ message: 'success' });
  } catch (e) {
    return Result.error(e);
  }
};

export const createInstance = async (
  compute: Compute,
  vmName: string,
  config: InstanceConfig,
): AsyncResult<{ message: string }> => {
  try {
    const zone = compute.zone(ZONE);
    const vm = zone.vm(vmName);
    const [, operation] = (await vm.create(await createInstanceConfig(vmName, config))) as [VM, Operation];
    await operation.promise();
    return Result.ok({ message: 'success' });
  } catch (e) {
    return Result.error(e);
  }
};

export const deleteInstance = async (compute: Compute, vmName: string): AsyncResult<{ message: string }> => {
  try {
    const zone = compute.zone(ZONE);
    const vm = zone.vm(vmName);
    const [operation] = ((await vm.delete()) as unknown) as [Operation, {}];
    await operation.promise();
    return Result.ok({ message: 'success' });
  } catch (e) {
    return Result.error(e);
  }
};

// https://cloud.google.com/compute/docs/reference/rest/v1/instances
const createInstanceConfig = async (
  vmName: string,
  { machineType = 'n2-standard-4', diskSizeGb = 100, javaMemorySizeGb = 10 }: InstanceConfig,
) => {
  diskSizeGb = Math.floor(Math.max(10, diskSizeGb));
  javaMemorySizeGb = Math.floor(Math.max(2, javaMemorySizeGb));
  return {
    machineType: `zones/${ZONE}/machineTypes/${machineType}`,
    tags: { items: ['minecraft-server'] },
    networkInterfaces: [
      {
        network: 'global/networks/default',
        accessConfigs: [{ type: 'ONE_TO_ONE_NAT' }],
      },
    ],
    disks: [
      {
        type: 'PERSISTENT',
        mode: 'READ_WRITE',
        boot: true,
        initializeParams: {
          sourceImage: 'projects/ubuntu-os-cloud/global/images/family/ubuntu-1804-lts',
          diskSizeGb: `${diskSizeGb}`,
          diskType: `zones/${ZONE}/diskTypes/pd-ssd`,
        },
        autoDelete: true,
      },
    ],
    metadata: {
      items: [
        { key: 'startup-script', value: await createStartupScript(vmName, javaMemorySizeGb) },
        { key: 'shutdown-script', value: await createShutdownScript() },
      ],
    },
    // "serviceAccounts": [
    //   {
    //     "email": string,
    //     "scopes": [
    //       string
    //     ]
    //   }
    // ],
    // "labels": {
    //   string: string,
    //   ...
    // },
    deletionProtection: false,
  };
};

const mcsDir = (...fragments: string[]) => {
  return path.resolve(__dirname, '../../mcs', ...fragments);
};
export const createStartupScript = async (vmName: string, javaMemorySize: number) => {
  const [makefileTemplate, startupTemplate] = await Promise.all([
    fs.readFile(mcsDir('Makefile'), 'utf-8'),
    fs.readFile(mcsDir('startup.sh'), 'utf-8'),
  ]);

  javaMemorySize = Math.floor(javaMemorySize);
  const variables = {
    BUCKET_NAME: bucketName,
    JAVA_MEM_SIZE: isNaN(javaMemorySize) ? null : javaMemorySize,
    SERVER_NAME: vmName,
  };
  const makefile = makefileTemplate.replace(
    '####_VARIABLE_DEFINITION_####',
    Object.entries(variables).reduce((acc, [key, value]) => {
      if (value !== null) {
        acc += `${key}=${value}`;
      }
      return acc;
    }, ''),
  );

  const startup = startupTemplate.replace('####_MAKEFILE_####', makefile);

  return startup;
};

const createShutdownScript = async () => {
  return await fs.readFile(mcsDir('Makefile'), 'utf-8');
};
