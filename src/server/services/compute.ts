import type { Request } from 'express-serve-static-core';
import * as computeAdapter from '../service-adapters/compute';
import createInstanceConfig from '../instance-config';

type InstanceInfo = Minecraft.MachineInfo;
type InstanceConfig = Omit<Minecraft.MachineConfig, 'name'>;

const extractInstanceInfo = ({ metadata: vm }: { metadata: any }): InstanceInfo => {
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
  req: Request,
  pageToken: string | undefined,
): Promise<{
  instances: InstanceInfo[];
  nextQuery: string | undefined;
}> => {
  const { vms, nextQuery } = await computeAdapter.listInstances(req, pageToken);
  const instances = vms.map((vm) => extractInstanceInfo(vm));
  return { instances, nextQuery };
};

export const getInstanceInfo = async (req: Request, vmName: string): Promise<InstanceInfo> => {
  const res = await computeAdapter.getInstance(req, vmName);
  return extractInstanceInfo(res);
};

export const startInstance = async (req: Request, vmName: string): Promise<{ message: string }> => {
  await computeAdapter.startInstance(req, vmName);
  return { message: 'success' };
};

export const stopInstance = async (req: Request, vmName: string): Promise<{ message: string }> => {
  await computeAdapter.stopInstance(req, vmName);
  return { message: 'success' };
};

export const deleteInstance = async (req: Request, vmName: string): Promise<{ message: string }> => {
  await computeAdapter.deleteInstance(req, vmName);
  return { message: 'success' };
};

export const createInstance = async (
  req: Request,
  vmName: string,
  config: InstanceConfig,
): Promise<{ message: string }> => {
  const instanceConfig = await createInstanceConfig(config);
  await computeAdapter.createInstance(req, vmName, instanceConfig);
  return { message: 'success' };
};
