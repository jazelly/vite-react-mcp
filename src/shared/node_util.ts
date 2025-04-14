// This files must be run in node runtime

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ViteDevServer } from 'vite';

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

/**
 * A Promise-based wrapper for Vite's WebSocket event system
 * @param server The Vite dev server instance
 * @param eventName The event name to listen for
 * @param timeout The timeout for the promise
 * @returns A Promise that resolves with the next event data
 */
export function waitForEvent<T>(
  server: ViteDevServer,
  eventName: string,
  timeout = 10000,
): Promise<{ data: T }> {
  return new Promise<{ data: T }>((resolve, reject) => {
    // Create a timeout to reject the promise if no response is received
    const timeoutId = setTimeout(() => {
      server.ws.off(eventName, handler);
      reject(new Error(`Timeout waiting for event: ${eventName}`));
    }, timeout);

    const handler = (data: T) => {
      clearTimeout(timeoutId);
      server.ws.off(eventName, handler);
      resolve({ data });
    };

    // Register the event handler
    server.ws.on(eventName, handler);
  });
}
