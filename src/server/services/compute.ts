import Compute, { Operation, VM } from '@google-cloud/compute';
import { METADATA } from '../constants';
import createInstanceConfig from '../instance-config';

type InstanceInfo = Minecraft.MachineInfo;
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
  const { ['java-memory-size']: javaMemorySize } = metadata.reduce<Record<string, string>>((acc, { key, value }) => {
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
): Promise<{
  instances: InstanceInfo[];
  nextQuery: string | undefined;
}> => {
  const zone = compute.zone(METADATA.zone);
  const [vms, nextQuery] = await zone.getVMs({ pageToken });
  const instances = vms.map((vm) => extractInstanceInfo(vm));
  return { instances, nextQuery };
};

export const getInstanceInfo = async (compute: Compute, vmName: string): Promise<InstanceInfo> => {
  const zone = compute.zone(METADATA.zone);
  const vm = zone.vm(vmName);
  const [res] = await vm.get();
  return extractInstanceInfo(res);
};

export const startInstance = async (compute: Compute, vmName: string): Promise<{ message: string }> => {
  const zone = compute.zone(METADATA.zone);
  const vm = zone.vm(vmName);
  const [operation] = await vm.start();
  await operation.promise();
  return { message: 'success' };
};

export const stopInstance = async (compute: Compute, vmName: string): Promise<{ message: string }> => {
  const zone = compute.zone(METADATA.zone);
  const vm = zone.vm(vmName);
  const [operation] = await vm.stop();
  await operation.promise();
  return { message: 'success' };
};

export const createInstance = async (
  compute: Compute,
  vmName: string,
  config: InstanceConfig,
): Promise<{ message: string }> => {
  const zone = compute.zone(METADATA.zone);
  const vm = zone.vm(vmName);
  const instanceConfig = await createInstanceConfig(vmName, config);
  const [, operation] = (await vm.create(instanceConfig)) as [VM, Operation];
  await operation.promise();
  return { message: 'success' };
};

export const deleteInstance = async (compute: Compute, vmName: string): Promise<{ message: string }> => {
  const zone = compute.zone(METADATA.zone);
  const vm = zone.vm(vmName);
  const [operation] = (await vm.delete()) as unknown as [Operation, {}];
  await operation.promise();
  return { message: 'success' };
};
