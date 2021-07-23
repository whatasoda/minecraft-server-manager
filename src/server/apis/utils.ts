import { createProxyMiddleware } from 'http-proxy-middleware';
import querystring from 'querystring';
import { McsHandlers } from '../../mcs';
import createApiClient from '../../shared/apiClientFactory';
import { createMcsAuthHeaders } from '../../shared/mcs-token';
import { MCS_PORT, MCS_TOKEN_SECRET, METADATA, PROJECT_ID } from '../constants';
import { getInstanceInfo } from '../services/compute';
import { initComputeContext } from '../service-adapters/compute';

export const mcsHostname = (instance: string) => `${instance}.${METADATA.ZONE}.c.${PROJECT_ID}.internal`;

export const resolveMcsBaseUrl = async (instance: string, getInfo: () => Promise<{ globalIP: string | null }>) => {
  if (process.env.NODE_ENV === 'production') {
    return `http://${mcsHostname(instance)}:${MCS_PORT}`;
  } else {
    const { globalIP } = await getInfo();
    return globalIP ? `http://${globalIP}:${MCS_PORT}` : null;
  }
};

export const McsApiClient = createApiClient<McsHandlers>({}, (client) => {
  client.interceptors.request.use((req) => {
    const { instance } = { ...req.data, ...req.params } as { instance?: string };
    if (!instance) return req;

    const authHeaders = createMcsAuthHeaders(mcsHostname(instance), MCS_TOKEN_SECRET);
    const headers = { ...req.headers, ...authHeaders };

    return { ...req, headers };
  });
})({
  status: { path: '/server-status', method: 'get' },
});

// TODO: set short timeout
export const createMcsProxy = (path: string) => {
  return createProxyMiddleware({
    pathRewrite: (original) => {
      const [, query = ''] = original.split('?');
      return `${path}?${query}`;
    },
    router: async (req) => {
      initComputeContext(req);
      const { instance } = { ...req.body, ...req.query } as { instance?: string };
      const baseUrl = await resolveMcsBaseUrl(instance!, () => getInstanceInfo(req, instance!));
      if (!baseUrl) {
        // eslint-disable-next-line no-console
        console.log('Target instance inactive: skipped proxy');
        throw {};
      }
      return baseUrl;
    },
    onProxyReq: (proxyReq, req) => {
      const { instance } = { ...req.body, ...req.query } as { instance?: string };
      const hostname = `${instance}.${METADATA.ZONE}.c.${PROJECT_ID}.internal`;
      const authHeaders = createMcsAuthHeaders(hostname, MCS_TOKEN_SECRET);

      Object.entries(authHeaders).forEach(([name, value]) => {
        proxyReq.setHeader(name, value);
      });

      // https://github.com/chimurai/http-proxy-middleware/issues/320#issuecomment-474922392
      const contentType = proxyReq.getHeader('Content-Type');
      if (req.body && typeof contentType === 'string') {
        const writeBody = (bodyData: string) => {
          proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
          proxyReq.write(bodyData);
        };
        if (contentType.includes('application/json')) {
          writeBody(JSON.stringify(req.body));
        }
        if (contentType.includes('application/x-www-form-urlencoded')) {
          writeBody(querystring.stringify(req.body));
        }
      }
    },
  });
};
