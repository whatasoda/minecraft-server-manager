import fs from 'fs-extra';
import { BUCKET_NAME, MCS_TOKEN_SECRET, METADATA, PROJECT_ID } from './constants';
import { mcsdir } from '../shared/workdir';

type InstanceConfig = Omit<Minecraft.MachineConfig, 'name'>;

// https://cloud.google.com/compute/docs/reference/rest/v1/instances
export default async function createInstanceConfig(
  vmName: string,
  { machineType = 'n2-standard-4', diskSizeGb = 100, javaMemorySizeGb = 10 }: InstanceConfig,
) {
  const { ZONE } = METADATA;
  diskSizeGb = Math.floor(Math.max(10, diskSizeGb));
  javaMemorySizeGb = Math.floor(Math.max(2, javaMemorySizeGb));

  return {
    machineType: `zones/${ZONE}/machineTypes/${machineType}`,
    tags: {
      items: ['minecraft-server', process.env.NODE_ENV !== 'production' ? 'minecraft-server-dev' : null].filter(
        Boolean,
      ),
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
          diskType: `zones/${ZONE}/diskTypes/pd-ssd`,
        },
        autoDelete: true,
      },
    ],
    metadata: {
      items: [
        { key: 'java-memory-size', value: javaMemorySizeGb },
        { key: 'startup-script', value: await startupScript(vmName, javaMemorySizeGb) },
        { key: 'shutdown-script', value: await shutdownScript() },
        { key: 'mcs-token-secret', value: MCS_TOKEN_SECRET },
      ],
    },
    serviceAccounts: [
      {
        email: `mcs-compute@${PROJECT_ID}.iam.gserviceaccount.com`,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      },
    ],
    deletionProtection: false,
  };
}

export const startupScript = async (vmName: string, javaMemorySize: number) => {
  const [makefileTemplate, startupTemplate] = await Promise.all([
    fs.readFile(mcsdir('Makefile'), 'utf-8'),
    fs.readFile(mcsdir('startup.sh'), 'utf-8'),
  ]);

  javaMemorySize = Math.floor(javaMemorySize);
  const variables = {
    BUCKET_NAME: BUCKET_NAME,
    JAVA_MEM_SIZE: isNaN(javaMemorySize) ? null : javaMemorySize,
    SERVER_NAME: vmName,
  };
  const makefile = makefileTemplate.replace(
    '####_VARIABLE_DEFINITION_####',
    Object.entries(variables).reduce((acc, [key, value]) => {
      if (value !== null) {
        acc += `${key}=${value}\n`;
      }
      return acc;
    }, ''),
  );

  const startup = startupTemplate.replace('####_MAKEFILE_####', makefile.replace(/\$/g, '$$$$'));

  return startup;
};

const shutdownScript = async () => {
  return await fs.readFile(mcsdir('Makefile'), 'utf-8');
};
