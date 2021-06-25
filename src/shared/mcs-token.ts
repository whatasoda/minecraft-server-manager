import crypto from 'crypto';
import type { IncomingHttpHeaders } from 'http';

const TOKEN_LIFESPAN = 5 * 1000;

interface McsAuthHeaders {
  'X-MCS-TOKEN': string;
  'X-MCS-TIMESTAMP': string;
}

interface TokenSource {
  hostname: string;
  timestamp: string;
  secret: string;
}

function generateToken({ hostname, timestamp, secret }: TokenSource) {
  const shasum = crypto.createHash('sha1');
  shasum.update(hostname + timestamp + secret);
  return shasum.digest('hex');
}

function verifyToken(receivedToken: string, source: TokenSource) {
  const computedToken = generateToken(source);
  return receivedToken === computedToken;
}

export function createMcsAuthHeaders(hostname: string, secret: string): McsAuthHeaders {
  const timestamp = Date.now().toString();
  const token = generateToken({ hostname, timestamp, secret });
  return {
    'X-MCS-TOKEN': token,
    'X-MCS-TIMESTAMP': timestamp,
  };
}

export function veirfyRequest(req: { headers: IncomingHttpHeaders }, hostname: string, secret: string): boolean {
  const { 'X-MCS-TOKEN': receivedToken, 'X-MCS-TIMESTAMP': timestamp } = req.headers as unknown as McsAuthHeaders;

  if (parseInt(timestamp) < Date.now() - TOKEN_LIFESPAN) {
    return false;
  } else {
    return verifyToken(receivedToken, { hostname, timestamp, secret });
  }
}
