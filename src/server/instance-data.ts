import { protos } from '@google-cloud/compute';

type InstanceInfo = Minecraft.MachineInfo;

export default function transformInstanceData(instance: protos.google.cloud.compute.v1.IInstance): InstanceInfo {
  const { name, machineType, status, metadata } = instance;
  const [{ networkIP: localIP, accessConfigs }] = instance.networkInterfaces || [];
  const [{ natIP: globalIP }] = accessConfigs || [];
  const [{ diskSizeGb: diskSize }] = instance.disks || [];

  const metadataMap = metadata?.items?.reduce<Record<string, string>>((acc, { key, value }) => {
    acc[key!] = value!;
    return acc;
  }, {});
  const { 'java-memory-size': javaMemorySize } = metadataMap || {};

  return {
    name: name!,
    machineType: machineType!,
    status: status!,
    localIP: localIP!,
    globalIP: globalIP ?? null,
    diskSize: diskSize!,
    javaMemorySize,
  };
}
