import { createProxyMiddleware } from 'http-proxy-middleware';
import type { Request } from 'express-serve-static-core';
import Compute from '@google-cloud/compute';
import { McsHandlers } from '../../mcs';
import createApiClient from '../../shared/apiClientFactory';
import { createMcsAuthHeaders } from '../../shared/mcs-token';
import { MCS_PORT, MCS_TOKEN_SECRET, METADATA, PROJECT_ID } from '../constants';
import { getInstanceInfo } from '../services/compute';

export const createCompute = (req: Request) => {
  if (req.authClient) {
    return new Compute({ projectId: PROJECT_ID, authClient: req.authClient });
  } else {
    return null;
  }
};

export const mcsHostname = (instance: string) => `${instance}.${METADATA.ZONE}.c.${PROJECT_ID}.internal`;

export const resolveMcsBaseUrl = async (instance: string, getInfo: () => Promise<{ globalIP?: string }>) => {
  if (process.env.NODE_ENV === 'production') {
    return `http://${mcsHostname(instance)}:${MCS_PORT}`;
  } else {
    const { globalIP } = await getInfo();
    return globalIP ? `http://${globalIP}:${MCS_PORT}` : null;
  }
};

export const McsApiClient = createApiClient<McsHandlers>({}, (client) => {
  client.interceptors.request.use((req) => {
    const { instance } = (req.params || req.data) as { instance?: string };
    if (!instance) return req;

    const authHeaders = createMcsAuthHeaders(mcsHostname(instance), MCS_TOKEN_SECRET);
    const headers = { ...req.headers, ...authHeaders };

    return { ...req, headers };
  });
})({
  status: ['/status', 'get'],
});

export const createMcsProxy = (path: string) => {
  return createProxyMiddleware({
    pathRewrite: () => path,
    router: async (req) => {
      const { instance } = req.body || req.query;
      const baseUrl = await resolveMcsBaseUrl(instance, () => {
        const compute = createCompute(req)!;
        return getInstanceInfo(compute, instance!);
      });
      if (!baseUrl) {
        // eslint-disable-next-line no-console
        console.log('Target instance inactive: skipped proxy');
        throw {};
      }
      return baseUrl;
    },
    onProxyReq: (proxyReq, req) => {
      const { instance } = req.body || req.query;
      const hostname = `${instance}.${METADATA.ZONE}.c.${PROJECT_ID}.internal`;
      const authHeaders = createMcsAuthHeaders(hostname, MCS_TOKEN_SECRET);

      Object.entries(authHeaders).forEach(([name, value]) => {
        proxyReq.setHeader(name, value);
      });
    },
  });
};
