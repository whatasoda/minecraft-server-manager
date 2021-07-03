import child_process, { ChildProcess } from 'child_process';
import workdir from '../shared/workdir';

type MakeArgs = [target: string, params?: Record<string, string>];

const make = (availableTargets: string[], ...[target, params = {}]: MakeArgs): ChildProcess => {
  if (availableTargets.includes(target)) {
    const argv = Object.entries(params)
      .map(([key, value]) => `${key}=${value}`)
      .join(' ');
    return child_process.exec(`make ${target} ${argv}`, { cwd: workdir() });
  } else {
    throw new Error(`No valid make target specified: '${target}'`);
  }
};

const dispatchTargets = [
  'start-minecraft',
  'kill-minecraft',
  'exec-command-minecraft',
  'save-minecraft-data',
  'load-minecraft-data',
  'stop-minecraft',
];
export const makeDispatch = async (...args: MakeArgs) => {
  const cp = make(dispatchTargets, ...args);
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
};

const queryTargets = ['server-status'];
export const makeQuery = async <T>(...args: MakeArgs) => {
  const cp = make(queryTargets, ...args);
  let data = '';
  cp.stdout?.on('data', (chunk: string) => {
    data += chunk;
  });
  return new Promise<T>((resolve, reject) => {
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
};
