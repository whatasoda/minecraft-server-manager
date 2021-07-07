import type { protos } from '@google-cloud/compute';

export default function transformOperation(
  operation: protos.google.cloud.compute.v1.IOperation,
): Meteora.OperationInfo {
  const { id } = operation;
  if (!id) {
    throw new Error('No valid operation id found');
  }
  return { id };
}
