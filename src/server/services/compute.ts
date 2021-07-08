import * as computeAdapter from '../service-adapters/compute';
import createInstanceConfig from '../models/instance-config';
import transformInstance from '../models/instance';
import transformOperation from '../models/operation';

type ContextKey = computeAdapter.ContextKey;

export const listInstances = async (
  req: ContextKey,
  pageToken: string | undefined,
): Promise<{
  instances: Meteora.InstanceInfo[];
  nextPageToken: string | undefined;
}> => {
  const { items, nextPageToken } = await computeAdapter.listInstances(req, pageToken);
  const instances = items?.map((vm) => transformInstance(vm)) || [];
  return { instances, nextPageToken: nextPageToken ?? undefined };
};

export const getInstanceInfo = async (key: ContextKey, instance: string): Promise<Meteora.InstanceInfo> => {
  const res = await computeAdapter.getInstance(key, instance);
  return transformInstance(res);
};

export const getOperationInfo = async (key: ContextKey, operation: string): Promise<Meteora.OperationInfo> => {
  const res = await computeAdapter.getOperation(key, operation);
  return transformOperation(res);
};

export const startInstance = async (key: ContextKey, instance: string): Promise<Meteora.OperationInfo> => {
  const operation = await computeAdapter.startInstance(key, instance);
  return transformOperation(operation);
};

export const stopInstance = async (key: ContextKey, instance: string): Promise<Meteora.OperationInfo> => {
  const operation = await computeAdapter.stopInstance(key, instance);
  return transformOperation(operation);
};

export const deleteInstance = async (key: ContextKey, instance: string): Promise<Meteora.OperationInfo> => {
  const operation = await computeAdapter.deleteInstance(key, instance);
  return transformOperation(operation);
};

export const createInstance = async (key: ContextKey, config: Meteora.ServerConfig): Promise<Meteora.OperationInfo> => {
  const operation = await computeAdapter.insertInstance(key, await createInstanceConfig(config));
  return transformOperation(operation);
};
