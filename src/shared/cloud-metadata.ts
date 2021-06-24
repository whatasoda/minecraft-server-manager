import fetch from 'node-fetch';

const METADATA_BASE_URL = 'http://metadata.google.internal';

interface MetadataRequestConfig {
  path: string;
  fallback: string;
  transform?: (raw: string) => string;
}

interface MetadataRequestRecord {
  [key: string]: MetadataRequestConfig;
}

const defaultTransform = (raw: string) => raw;

export default function CloudMetadata<T extends MetadataRequestRecord>(requests: T) {
  const metadata: Record<string, string> = {};

  const promises = Object.entries(requests).map(async ([key, config]) => {
    const { path, fallback, transform = defaultTransform } = config;
    return fetch(`${METADATA_BASE_URL}${path}`, { headers: { 'Metadata-Flavor': 'Google' } })
      .then(async (res) => {
        if (res.status === 200) {
          const raw = await res.text();
          metadata[key] = transform(raw);
        } else {
          metadata[key] = fallback;
        }
      })
      .catch(() => {
        metadata[key] = fallback;
      });
  });

  return {
    metadata: metadata as Readonly<Record<keyof T, string>>,
    waitForMetadataLoad: (callback: () => void) => {
      const fn = () => callback();
      Promise.all(promises).then(fn, fn);
    },
  };
}
