import * as computeAdapter from '../service-adapters/compute';
import createInstanceConfig from '../models/instance-config';
import transformInstance from '../models/instance';
import transformOperation from '../models/operation';

type InstanceInfo = Minecraft.MachineInfo;
type InstanceConfig = Minecraft.MachineConfig;

type ContextKey = computeAdapter.ContextKey;

export const listInstances = async (
  req: ContextKey,
  pageToken: string | undefined,
): Promise<{
  instances: InstanceInfo[];
  nextPageToken: string | undefined;
}> => {
  const { items, nextPageToken } = await computeAdapter.listInstances(req, pageToken);
  const instances = items?.map((vm) => transformInstance(vm)) || [];
  return { instances, nextPageToken: nextPageToken ?? undefined };
};

export const getInstanceInfo = async (key: ContextKey, vmName: string): Promise<InstanceInfo> => {
  const res = await computeAdapter.getInstance(key, vmName);
  return transformInstance(res);
};

export const startInstance = async (key: ContextKey, vmName: string): Promise<{ operationId: string }> => {
  const operation = await computeAdapter.startInstance(key, vmName);
  return transformOperation(operation);
};

export const stopInstance = async (key: ContextKey, vmName: string): Promise<{ operationId: string }> => {
  const operation = await computeAdapter.stopInstance(key, vmName);
  return transformOperation(operation);
};

export const deleteInstance = async (key: ContextKey, vmName: string): Promise<{ operationId: string }> => {
  const operation = await computeAdapter.deleteInstance(key, vmName);
  return transformOperation(operation);
};

export const createInstance = async (key: ContextKey, config: InstanceConfig): Promise<{ operationId: string }> => {
  const operation = await computeAdapter.insertInstance(key, await createInstanceConfig(config));
  return transformOperation(operation);
};
