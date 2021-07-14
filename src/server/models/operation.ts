import type { compute_v1 } from 'googleapis';

export default function transformOperation(operation: compute_v1.Schema$Operation): Meteora.OperationInfo {
  const { id, status } = operation;
  if (!id) {
    throw new Error('No valid operation id found');
  }
  return {
    id,
    status: (status as Meteora.OperationStatus) ?? 'UNDEFINED_STATUS',
  };
}
