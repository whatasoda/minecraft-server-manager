import CloudMetadata from '../shared/cloud-metadata';

// https://cloud.google.com/appengine/docs/standard/nodejs/runtime?hl=en#environment_variables
export const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'whatasoda-mc-server';
export const BUCKET_NAME = process.env.BUCKET_NAME || 'whatasoda-test-mc-server-data';

export const { metadata: METADATA, waitForMetadataLoad } = CloudMetadata({
  zone: {
    path: '/computeMetadata/v1/instance/zone',
    fallback: 'asia-northeast1-a',
    transform: (raw) => raw.split('/').pop()!,
  },
});
