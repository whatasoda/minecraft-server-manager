import type { Request } from 'express-serve-static-core';
import Compute from '@google-cloud/compute';
import { METADATA, PROJECT_ID } from '../constants';

interface ComputeContext {
  zone: string;
  compute: Compute;
}

const computeContextMap = new WeakMap<{}, ComputeContext>();

export const initComputeContext = (req: Request) => {
  if (computeContextMap.has(req)) return;
  if (req.authClient) {
    const zone = METADATA.ZONE;
    const compute = new Compute({ projectId: PROJECT_ID, authClient: req.authClient });
    computeContextMap.set(req, { zone, compute });
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
  const { compute, zone } = getComputeContext(req);
  const [vms, nextQuery] = await compute.zone(zone).getVMs({ pageToken });
  return { vms, nextQuery };
};

export const getInstance = async (req: Request, vmName: string) => {
  const { compute, zone } = getComputeContext(req);
  const vm = compute.zone(zone).vm(vmName);
  return (await vm.get())[0];
};

export const startInstance = async (req: Request, vmName: string) => {
  const { compute, zone } = getComputeContext(req);
  const vm = compute.zone(zone).vm(vmName);
  const [operation] = await vm.start();
  await operation.promise();
};

export const stopInstance = async (req: Request, vmName: string) => {
  const { compute, zone } = getComputeContext(req);
  const vm = compute.zone(zone).vm(vmName);
  const [operation] = await vm.stop();
  await operation.promise();
};

export const deleteInstance = async (req: Request, vmName: string) => {
  const { compute, zone } = getComputeContext(req);
  const vm = compute.zone(zone).vm(vmName);
  const [operation] = (await vm.delete()) as [any];
  await operation.promise();
};

export const createInstance = async (req: Request, vmName: string, config: {}) => {
  const { compute, zone } = getComputeContext(req);
  const vm = compute.zone(zone).vm(vmName);
  const [, operation] = await vm.create(config);
  await operation.promise();
};
