import type { Request } from 'express-serve-static-core';
import * as computeAdapter from '../service-adapters/compute';
import createInstanceConfig from '../instance-config';
import transformInstanceData from '../instance-data';

type InstanceInfo = Minecraft.MachineInfo;
type InstanceConfig = Minecraft.MachineConfig;

export const listInstances = async (
  req: Request,
  pageToken: string | undefined,
): Promise<{
  instances: InstanceInfo[];
  nextPageToken: string | undefined;
}> => {
  const { items, nextPageToken } = await computeAdapter.listInstances(req, pageToken);
  const instances = items.map((vm) => transformInstanceData(vm));
  return { instances, nextPageToken: nextPageToken ?? undefined };
};

export const getInstanceInfo = async (req: Request, vmName: string): Promise<InstanceInfo> => {
  const res = await computeAdapter.getInstance(req, vmName);
  return transformInstanceData(res);
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

export const createInstance = async (req: Request, config: InstanceConfig): Promise<{ message: string }> => {
  await computeAdapter.insertInstance(req, await createInstanceConfig(config));
  return { message: 'success' };
};
