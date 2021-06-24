import child_process, { ChildProcess } from 'child_process';
import type * as stream from 'stream';
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

const streamTargets = ['log-minecraft', 'log-agent'];
export const makeStream = (dist: stream.Writable, ...args: MakeArgs) => {
  const cp = make(streamTargets, ...args);
  connectProcessToStream(cp, dist);
  return cp;
};
const connectProcessToStream = (cp: ChildProcess, dist: stream.Writable) => {
  cp.stdout?.on('data', (data) => {
    dist.write(data);
  });
  cp.stderr?.on('data', (data) => {
    dist.write(data);
  });
  cp.on('close', () => {
    dist.end();
  });
  dist.on('close', () => {
    if (cp.exitCode === null) {
      cp.kill('SIGINT');
    }
  });
};

export const logFile = (target: string) => {
  return workdir(`make-${target}.log`);
};
