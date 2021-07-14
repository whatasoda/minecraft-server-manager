import { google, compute_v1 } from 'googleapis';
import { METADATA, PROJECT_ID } from '../constants';
import { GoogleAuth } from 'google-auth-library';

export type ContextKey = { authClient?: GoogleAuth };

interface ComputeContext {
  common: { zone: string; project: string };
  compute: compute_v1.Compute;
}

const computeContextMap = new WeakMap<ContextKey, ComputeContext>();

export const initComputeContext = (key: ContextKey) => {
  if (computeContextMap.has(key)) return;
  const { authClient } = key;
  if (authClient) {
    const compute = google.compute({ version: 'v1', auth: authClient });
    const common = { zone: METADATA.ZONE, project: PROJECT_ID };
    computeContextMap.set(key, { common, compute });
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
  const { compute, common } = getComputeContext(key);
  const { data } = await compute.instances.list({ ...common, project: PROJECT_ID, pageToken });
  return data;
};

export const getInstance = async (key: ContextKey, instance: string) => {
  const { compute, common } = getComputeContext(key);
  const { data } = await compute.instances.get({ ...common, instance });
  return data;
};

export const getOperation = async (key: ContextKey, operation: string) => {
  const { compute, common } = getComputeContext(key);
  const { data } = await compute.zoneOperations.get({ ...common, operation });
  return data;
};

export const startInstance = async (key: ContextKey, instance: string) => {
  const { compute, common } = getComputeContext(key);
  const { data: operation } = await compute.instances.start({ ...common, instance });
  return operation;
};

export const stopInstance = async (key: ContextKey, instance: string) => {
  const { compute, common } = getComputeContext(key);
  const { data: operation } = await compute.instances.stop({ ...common, instance });
  return operation;
};

export const deleteInstance = async (key: ContextKey, instance: string) => {
  const { compute, common } = getComputeContext(key);
  const { data: operation } = await compute.instances.delete({ ...common, instance });
  return operation;
};

export const insertInstance = async (key: ContextKey, instanceResource: compute_v1.Schema$Instance) => {
  const { compute, common } = getComputeContext(key);
  const { data: operation } = await compute.instances.insert({ ...common, requestBody: instanceResource });
  return operation;
};
