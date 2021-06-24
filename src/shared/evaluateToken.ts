import crypto from 'crypto';

export default function evaluateToken(data: string, secret: string) {
  const shasum = crypto.createHash('sha1');
  shasum.update(data + secret);
  return shasum.digest('hex');
}
