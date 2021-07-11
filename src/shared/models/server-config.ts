import type { protos } from '@google-cloud/compute';
import { machineTypeMap, machineTypes } from '../constants/machineType';

export const serverConfigDefault: Meteora.ServerConfig = {
  name: 'minecraft-server',
  machineType: machineTypes[0].name,
  diskSizeGb: 15,
  javaMemorySizeGb: 5,
};

interface InstanceConfigContext {
  projectId: string;
  zone: string;
  bucketName: string;
  mcsTokenSecret: string;
  startupScript: string;
  shutdownScript: string;
}
export const createInstanceConfig = (
  config: Meteora.ServerConfig,
  context: InstanceConfigContext,
): protos.google.cloud.compute.v1.IInstance => {
  const { isAllValid, ...validation } = validateServerConfig(config, { servers: [] });
  if (!isAllValid) {
    throw new Error(`Invalid server config: ${JSON.stringify(validation, null, '  ')}`);
  }

  const { name, machineType, diskSizeGb, javaMemorySizeGb } = config;
  const { projectId, zone, bucketName, mcsTokenSecret, startupScript, shutdownScript } = context;
  const commonTags = ['minecraft-server'];
  const prodTags = [...commonTags];
  const devTags = [...commonTags, 'minecraft-server-dev'];

  // https://cloud.google.com/compute/docs/reference/rest/v1/instances
  return {
    name,
    machineType: `zones/${zone}/machineTypes/${machineType}`,
    tags: {
      items: process.env.NODE_ENV === 'production' ? prodTags : devTags,
    },
    networkInterfaces: [
      {
        network: 'global/networks/default',
        accessConfigs: [{ type: 'ONE_TO_ONE_NAT' }],
      },
    ],
    disks: [
      {
        type: 'PERSISTENT',
        mode: 'READ_WRITE',
        boot: true,
        initializeParams: {
          sourceImage: 'projects/ubuntu-os-cloud/global/images/family/ubuntu-2004-lts',
          diskSizeGb: `${diskSizeGb}`,
          diskType: `zones/${zone}/diskTypes/pd-ssd`,
        },
        autoDelete: true,
      },
    ],
    metadata: {
      items: [
        { key: 'startup-script', value: startupScript },
        { key: 'shutdown-script', value: shutdownScript },
        { key: 'bucket-name', value: bucketName },
        { key: 'mcs-token-secret', value: mcsTokenSecret },
        { key: 'java-memory-size', value: `${javaMemorySizeGb}` },
      ],
    },
    serviceAccounts: [
      {
        email: `mcs-compute@${projectId}.iam.gserviceaccount.com`,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      },
    ],
    deletionProtection: false,
  };
};

interface ValidationContext {
  servers: { name: string }[];
}

interface ValidationResult {
  isAllValid: boolean;
  name: {
    alreadyExists: boolean;
    invalidCharactors: boolean;
  };
  machineType: {
    invalidMachineType: boolean;
  };
  diskSizeGb: {
    noFloatAllowed: boolean;
    tooSmall: boolean;
    tooBig: boolean;
  };
  javaMemorySizeGb: {
    noFloatAllowed: boolean;
    tooSmall: boolean;
    tooBig: boolean;
  };
}

export const validateServerConfig = (
  serverConfig: Meteora.ServerConfig,
  context: ValidationContext,
): ValidationResult => {
  const { name, machineType, diskSizeGb, javaMemorySizeGb } = serverConfig;
  const { memoryGb, maximumPersistentDisksSizeGb } = machineTypeMap.get(machineType) || {
    memoryGb: Infinity,
    maximumPersistentDisksSizeGb: Infinity,
  };
  const maxMemoryGb = Math.max(memoryGb - 2, 2);

  const result: Omit<ValidationResult, 'isAllValid'> = {
    name: {
      alreadyExists: !context.servers.some((item) => item.name === name),
      invalidCharactors: !isValidInstanceName(name),
    },
    machineType: {
      invalidMachineType: !machineTypeMap.has(machineType),
    },
    diskSizeGb: {
      noFloatAllowed: !Number.isInteger(diskSizeGb),
      tooSmall: diskSizeGb < 10,
      tooBig: diskSizeGb > maximumPersistentDisksSizeGb,
    },
    javaMemorySizeGb: {
      noFloatAllowed: !Number.isInteger(javaMemorySizeGb),
      tooSmall: javaMemorySizeGb < 2,
      tooBig: javaMemorySizeGb > maxMemoryGb,
    },
  };

  const isAllValid = Object.values(result).every((item) => Object.values(item).every(Boolean));
  return { isAllValid, ...result };
};

// https://cloud.google.com/compute/docs/reference/rest/v1/instances/insert#body.request_body.FIELDS.name
const INSTANCE_NAME_VALID_CHAR = /[a-z]([-a-z0-9]*[a-z0-9])?/;
const INSTANCE_NAME_MAX_LENGTH = 63;
const INSTANCE_NAME_MIN_LENGTH = 1;
export const isValidInstanceName = (name: string) => {
  return (
    INSTANCE_NAME_VALID_CHAR.test(name) &&
    name.length >= INSTANCE_NAME_MIN_LENGTH &&
    name.length <= INSTANCE_NAME_MAX_LENGTH
  );
};
