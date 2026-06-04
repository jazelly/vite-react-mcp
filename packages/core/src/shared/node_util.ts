// This files must be run in node runtime

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let packageVersion: string | undefined;

/**
 * Read package.json and get the version string
 * @param packageVersion
 * @returns
 */
export function getVersionString() {
  try {
    packageVersion ??= JSON.parse(
      readFileSync(resolve(__dirname, '..', '..', 'package.json')).toString(),
    ).version;
  } catch (error) {
    console.error('Error reading package.json', error);
    packageVersion = 'unknown';
  }

  return packageVersion;
}
