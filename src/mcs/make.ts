import child_process, { ChildProcess } from 'child_process';
import workdir from '../shared/workdir';

const createMakeFunc = <T extends string, U>(
  targets: readonly T[],
  handleChildProcess: (cp: ChildProcess) => Promise<U>,
) => {
  return function make(target: T, params: Record<string, string> = {}): Promise<U> {
    if (targets.includes(target)) {
      const argv = Object.entries(params)
        .map(([key, value]) => `${key}=${value}`)
        .join(' ');
      const cp = child_process.exec(`make --no-print-directory ${target} ${argv}`, { cwd: workdir() });
      return handleChildProcess(cp);
    } else {
      throw new Error(`No valid make target specified: '${target}'`);
    }
  };
};

export type MakeDispatchTarget = typeof dispatchTargets[number];
const dispatchTargets = [
  'load-server',
  'load-datapacks',
  'backup-server',
  'update-server-source',
  'server-command',
  'start-server',
  'stop-server',
] as const;
export const makeDispatch = createMakeFunc(dispatchTargets, (cp) => {
  return new Promise<void>((resolve, reject) => {
    cp.stdout?.pipe(process.stdout);
    cp.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Process exited with non-zero code: ${code}`));
      }
    });
  });
});

export type MakeQueryTarget = typeof queryTargets[number];
const queryTargets = ['server-status'] as const;
export const makeQuery = createMakeFunc(queryTargets, async (cp) => {
  let data = '';
  cp.stdout?.on('data', (chunk: string) => {
    data += chunk;
  });
  return new Promise<{}>((resolve, reject) => {
    cp.on('close', (code) => {
      if (code === 0) {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('query failed with unknown reason'));
        }
      } else {
        reject(new Error(`Process exited with non-zero code: ${code}`));
      }
    });
  });
});
