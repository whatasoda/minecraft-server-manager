import path from 'path';

export default function workdir(...fragments: string[]) {
  return path.resolve(process.env.INIT_CWD || process.cwd(), ...fragments);
}

export function mcsdir(...fragments: string[]) {
  return workdir('src/mcs', ...fragments);
}
