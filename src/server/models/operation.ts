import type { protos } from '@google-cloud/compute';

export default function transformOperation(operation: protos.google.cloud.compute.v1.IOperation) {
  const { id: operationId } = operation;
  if (!operationId) {
    throw new Error('No valid operation id found');
  }
  return { operationId };
}
