import fs from 'fs';
import { BUCKET_NAME, MCS_TOKEN_SECRET, METADATA, PROJECT_ID } from './constants';
import { mcsdir } from '../shared/workdir';

type InstanceConfig = Omit<Minecraft.MachineConfig, 'name'>;

// https://cloud.google.com/compute/docs/reference/rest/v1/instances
export default async function createInstanceConfig({
  machineType = 'n2-standard-4',
  diskSizeGb = 100,
  javaMemorySizeGb = 10,
}: InstanceConfig) {
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
        { key: 'startup-script', value: await startupScript() },
        { key: 'shutdown-script', value: await shutdownScript() },
        { key: 'bucket-name', value: BUCKET_NAME },
        { key: 'mcs-token-secret', value: MCS_TOKEN_SECRET },
        { key: 'java-memory-size', value: javaMemorySizeGb },
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

// TODO: store them as a JSON on build time
export const startupScript = async () => {
  return await fs.promises.readFile(mcsdir('startup.sh'), 'utf-8');
};

const shutdownScript = async () => {
  return await fs.promises.readFile(mcsdir('shutdown.sh'), 'utf-8');
};
