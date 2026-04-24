import { execSync } from 'node:child_process';

// Intentionally vulnerable — command injection via template interpolation
export function gitLog(branch: string) {
  return execSync(`git log ${branch} --oneline`).toString();
}
