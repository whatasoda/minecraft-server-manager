import fetch from 'node-fetch';
const metadataObtainations: Promise<void>[] = [];

// https://cloud.google.com/appengine/docs/standard/nodejs/runtime?hl=en#environment_variables
export const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'whatasoda-mc-server';
export const BUCKET_NAME = process.env.BUCKET_NAME || 'whatasoda-test-mc-server-data';
export const METADATA = {
  zone: createMetadataGetter('/computeMetadata/v1/instance/zone', 'asia-northeast1-a', (raw) => {
    return raw.split('/').pop()!;
  }),
};

export const waitForMetadataObtainations = () => {
  return Promise.all(metadataObtainations).then(
    () => {},
    () => {},
  );
};
function createMetadataGetter(path: string, fallback: string, transform: (raw: string) => string = (raw) => raw) {
  let cache: string;

  const promise = fetch(`http://metadata.google.internal${path}`, {
    headers: {
      'Metadata-Flavor': 'Google',
    },
  }).then(async (res) => {
    if (res.status === 200) {
      const raw = await res.text();
      cache = transform(raw);
    } else {
      cache = fallback;
    }
  });
  metadataObtainations.push(promise);

  return () => cache;
}
