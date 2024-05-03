import type { SpawnOptionsWithoutStdio } from 'node:child_process';
import { spawn } from 'node:child_process';
import process from 'node:process';

export function runProcess(command: string, args: string[] = [], options?: SpawnOptionsWithoutStdio) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn(command, args, {
      env: {
        ...process.env,
      },
      ...options,
    });
    const output: string[] = [];
    const errors: string[] = [];

    child.stdout.on('data', chunk => output.push(chunk));
    child.stderr.on('data', chunk => errors.push(chunk));

    child.on('close', () => {
      if (errors.length) {
        reject(errors.join('').trim());
        return;
      }

      resolve(output.join('').trim());
    });

    child.on('error', error => reject(error));
  });
}
