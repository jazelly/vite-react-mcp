const path = require('node:path');
const { composePlugins, withNx } = require('@nrwl/webpack');
const { withReact } = require('@nrwl/react');
const { merge } = require('webpack-merge');
const withModuleFederation = require('../../module-federation');
const { replaceDefinePlugin } = require('../../webpack.config.base');
const moduleFederationConfig = require('./module-federation.config');
const workspaceRoot = path.resolve(__dirname, '../..');

module.exports = composePlugins(
  withNx(),
  withReact(),
  async (config, nxContext) => {
    const federatedModules = await withModuleFederation(
      moduleFederationConfig,
    );
    const { default: withReactMcpWebpack } = await import('webpack-react-mcp');
    const mergedConfig = replaceDefinePlugin(
      merge(federatedModules(config, nxContext), {
        devServer: {
          historyApiFallback: true,
          client: {
            overlay: false,
          },
        },
      }),
    );

    return withReactMcpWebpack(
      mergedConfig,
      {
        mode:
          nxContext?.context?.configurationName === 'production'
            ? 'production'
            : 'development',
      },
      { rootDir: workspaceRoot },
    );
  },
);
