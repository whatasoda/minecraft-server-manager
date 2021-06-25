import CloudMetadata from '../shared/cloud-metadata';
import workdir from '../shared/workdir';

// https://cloud.google.com/appengine/docs/standard/nodejs/runtime?hl=en#environment_variables
export const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'whatasoda-mc-server';
export const BUCKET_NAME = process.env.BUCKET_NAME || 'whatasoda-test-mc-server-data';
export const GAE_PORT = 8080;
export const MCS_PORT = 8000;

export const { metadata: METADATA, waitForMetadataLoad } = CloudMetadata({
  ZONE: {
    path: '/computeMetadata/v1/instance/zone',
    fallback: 'asia-northeast1-a',
    transform: (raw) => raw.split('/').pop()!,
  },
});

export const { secret: MCS_TOKEN_SECRET } = require(workdir('.mcs-token-secret.json')) as { secret: string };
