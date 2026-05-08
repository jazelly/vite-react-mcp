import path from 'node:path';
import { fileURLToPath } from 'node:url';

interface NextWebpackContext {
  dev: boolean;
  isServer: boolean;
  webpack: {
    DefinePlugin: new (definitions: Record<string, string>) => unknown;
  };
}

interface NextConfig {
  webpack?: (config: any, context: NextWebpackContext) => any;
  [key: string]: unknown;
}

const getClientEntryPath = () => {
  const currentFilePath = fileURLToPath(import.meta.url);
  const currentDirPath = path.dirname(currentFilePath);
  return path.join(currentDirPath, 'next_client_entry.js');
};

const prependEntry = (entryValue: unknown, prependPath: string): unknown => {
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
      if (key.startsWith('webpack-hot-middleware') || key === prependPath) {
        nextEntryObject[key] = value;
        continue;
      }

      nextEntryObject[key] = prependEntry(value, prependPath);
    }
    return nextEntryObject;
  }

  return entryValue;
};

export const withReactMcpNext = (nextConfig: NextConfig = {}): NextConfig => {
  return {
    ...nextConfig,
    webpack: (config: any, context: NextWebpackContext) => {
      const nextConfigWebpack = nextConfig.webpack;
      const transformedConfig =
        typeof nextConfigWebpack === 'function'
          ? nextConfigWebpack(config, context)
          : config;

      if (!context.dev || context.isServer) {
        return transformedConfig;
      }

      const entryPath = getClientEntryPath();
      const originalEntry = transformedConfig.entry;

      transformedConfig.entry = async () => {
        const resolvedEntry =
          typeof originalEntry === 'function'
            ? await originalEntry()
            : originalEntry;

        return prependEntry(resolvedEntry, entryPath);
      };

      return transformedConfig;
    },
  };
};

export default withReactMcpNext;
