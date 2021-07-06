import type { Request } from 'express-serve-static-core';
import { InstancesClient, ZoneOperationsClient, protos } from '@google-cloud/compute';
import { METADATA, PROJECT_ID } from '../constants';

interface ComputeContext {
  common: { zone: string; project: string };
  instances: InstancesClient;
  operations: ZoneOperationsClient;
}

const computeContextMap = new WeakMap<{}, ComputeContext>();

export const initComputeContext = (req: Request) => {
  if (computeContextMap.has(req)) return;
  const { authClient } = req;
  if (authClient) {
    const common = { zone: METADATA.ZONE, project: PROJECT_ID };
    const instances = new InstancesClient({ authClient, fallback: 'rest' });
    const operations = new ZoneOperationsClient({ authClient, fallback: 'rest' });
    computeContextMap.set(req, { common, instances, operations });
  }
};

const getComputeContext = (req: Request) => {
  const context = computeContextMap.get(req);
  if (!context) {
    throw new Error('No compute context found');
  }
  return context;
};

export const listInstances = async (req: Request, pageToken: string | undefined) => {
  const { instances, common } = getComputeContext(req);
  const [{ items, nextPageToken }] = await instances.list({ ...common, project: PROJECT_ID, pageToken });
  return { items: items ?? [], nextPageToken };
};

export const getInstance = async (req: Request, instance: string) => {
  const { instances, common } = getComputeContext(req);
  const [item] = await instances.get({ ...common, instance });
  return item;
};

export const startInstance = async (req: Request, instance: string) => {
  const { instances, operations, common } = getComputeContext(req);
  const [operation] = await instances.start({ ...common, instance });
  await operations.wait({ ...common, operation: operation.id });
};

export const stopInstance = async (req: Request, instance: string) => {
  const { instances, operations, common } = getComputeContext(req);
  const [operation] = await instances.stop({ ...common, instance });
  await operations.wait({ ...common, operation: operation.id });
};

export const deleteInstance = async (req: Request, instance: string) => {
  const { instances, operations, common } = getComputeContext(req);
  const [operation] = await instances.delete({ ...common, instance });
  await operations.wait({ ...common, operation: operation.id });
};

export const insertInstance = async (req: Request, instanceResource: protos.google.cloud.compute.v1.IInstance) => {
  const { instances, operations, common } = getComputeContext(req);
  const [operation] = await instances.insert({ ...common, instanceResource });
  await operations.wait({ ...common, operation: operation.id });
};
