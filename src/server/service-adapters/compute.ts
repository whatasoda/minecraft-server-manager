import { InstancesClient, ZoneOperationsClient, protos } from '@google-cloud/compute';
import { METADATA, PROJECT_ID } from '../constants';
import { GoogleAuth } from 'google-auth-library';

export type ContextKey = { authClient?: GoogleAuth };

interface ComputeContext {
  common: { zone: string; project: string };
  instances: InstancesClient;
  operations: ZoneOperationsClient;
}

const computeContextMap = new WeakMap<ContextKey, ComputeContext>();

export const initComputeContext = (key: ContextKey) => {
  if (computeContextMap.has(key)) return;
  const { authClient } = key;
  if (authClient) {
    const common = { zone: METADATA.ZONE, project: PROJECT_ID };
    const instances = new InstancesClient({ authClient, fallback: 'rest' });
    const operations = new ZoneOperationsClient({ authClient, fallback: 'rest' });
    computeContextMap.set(key, { common, instances, operations });
  }
};

const getComputeContext = (key: ContextKey) => {
  const context = computeContextMap.get(key);
  if (!context) {
    throw new Error('No compute context found');
  }
  return context;
};

export const listInstances = async (key: ContextKey, pageToken: string | undefined) => {
  const { instances, common } = getComputeContext(key);
  const [data] = await instances.list({ ...common, project: PROJECT_ID, pageToken });
  return data;
};

export const getInstance = async (key: ContextKey, instance: string) => {
  const { instances, common } = getComputeContext(key);
  const [data] = await instances.get({ ...common, instance });
  return data;
};

export const getOperation = async (key: ContextKey, operation: string) => {
  const { operations, common } = getComputeContext(key);
  const [data] = await operations.get({ ...common, operation });
  return data;
};

export const startInstance = async (key: ContextKey, instance: string) => {
  const { instances, common } = getComputeContext(key);
  const [operation] = await instances.start({ ...common, instance });
  return operation;
};

export const stopInstance = async (key: ContextKey, instance: string) => {
  const { instances, common } = getComputeContext(key);
  const [operation] = await instances.stop({ ...common, instance });
  return operation;
};

export const deleteInstance = async (key: ContextKey, instance: string) => {
  const { instances, common } = getComputeContext(key);
  const [operation] = await instances.delete({ ...common, instance });
  return operation;
};

export const insertInstance = async (key: ContextKey, instanceResource: protos.google.cloud.compute.v1.IInstance) => {
  const { instances, common } = getComputeContext(key);
  const [operation] = await instances.insert({ ...common, instanceResource });
  return operation;
};
