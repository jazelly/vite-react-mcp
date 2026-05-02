import path from 'node:path';
import { fileURLToPath } from 'node:url';

interface WebpackEnv {
  mode?: string;
}

const getClientEntryPath = () => {
  const currentFilePath = fileURLToPath(import.meta.url);
  const currentDirPath = path.dirname(currentFilePath);
  return path.join(currentDirPath, 'next_client_entry.js');
};

const prependWebpackEntry = (entryValue: unknown, prependPath: string): unknown => {
  if (typeof entryValue === 'string') {
    return [prependPath, entryValue];
  }

  if (Array.isArray(entryValue)) {
    return entryValue.includes(prependPath)
      ? entryValue
      : [prependPath, ...entryValue];
  }

  if (entryValue && typeof entryValue === 'object') {
    const entryObject = entryValue as Record<string, unknown>;
    const nextEntryObject: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(entryObject)) {
      nextEntryObject[key] = prependWebpackEntry(value, prependPath);
    }
    return nextEntryObject;
  }

  return entryValue;
};

export const withReactMcpWebpack = (
  config: Record<string, unknown>,
  env: WebpackEnv = {},
) => {
  const isDevelopmentMode = env.mode ? env.mode === 'development' : true;
  if (!isDevelopmentMode) {
    return config;
  }

  const nextConfig = { ...config };
  const entryPath = getClientEntryPath();

  nextConfig.entry = prependWebpackEntry(nextConfig.entry, entryPath);
  return nextConfig;
};

export default withReactMcpWebpack;
