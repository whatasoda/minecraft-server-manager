import { machineTypeMap } from '../constants/machineType';

interface ValidationConfig {
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

export default function validateServerConfig(
  serverConfig: Meteora.ServerConfig,
  validationConfig: ValidationConfig,
): ValidationResult {
  const { name, machineType, diskSizeGb, javaMemorySizeGb } = serverConfig;
  const { memoryGb, maximumPersistentDisksSizeGb } = machineTypeMap.get(machineType) || {
    memoryGb: Infinity,
    maximumPersistentDisksSizeGb: Infinity,
  };
  const maxMemoryGb = Math.max(memoryGb - 2, 2);

  const result: Omit<ValidationResult, 'isAllValid'> = {
    name: {
      alreadyExists: !validationConfig.servers.some((item) => item.name === name),
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
}

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
