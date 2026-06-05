const path = require('node:path');
const { composePlugins, withNx } = require('@nrwl/webpack');
const { withReact } = require('@nrwl/react');
const { merge } = require('webpack-merge');
const withModuleFederation = require('../../module-federation');
const { replaceDefinePlugin } = require('../../webpack.config.base');
const moduleFederationConfig = require('./module-federation.config');
const workspaceRoot = path.resolve(__dirname, '../..');
const toolkit = {
  tuningModal: {
    classNames: {
      surface: 'nx-shell-tuning-surface',
      panel: 'nx-shell-tuning-panel',
      control: 'nx-shell-tuning-control',
    },
    tokens: {
      panelRadius: '12px',
      controlRadius: '9px',
      primaryButtonBackground: '#4338ca',
      primaryButtonColor: '#ffffff',
      panelShadow: '0 24px 72px rgba(67, 56, 202, 0.22)',
    },
    styles: {
      surface: {
        filter: 'drop-shadow(0 18px 40px rgba(67, 56, 202, 0.15))',
      },
      panel: {
        border: '1px solid rgba(67, 56, 202, 0.24)',
      },
      targetTag: {
        background: '#eef2ff',
        color: '#4338ca',
      },
      sectionTitle: {
        color: '#4338ca',
      },
    },
  },
};

module.exports = composePlugins(
  withNx(),
  withReact(),
  async (config, nxContext) => {
    const federatedModules = await withModuleFederation(
      moduleFederationConfig,
    );
    const { default: withAgenticReactWebpack } = await import('@agentic-react/webpack');
    const mergedConfig = replaceDefinePlugin(
      merge(federatedModules(config, nxContext), {
        devServer: {
          historyApiFallback: true,
          client: {
            overlay: false,
          },
        },
        resolve: {
          fallback: {
            fs: false,
            net: false,
            tls: false,
          },
        },
      }),
    );

    return withAgenticReactWebpack(
      mergedConfig,
      {
        mode:
          nxContext?.context?.configurationName === 'production'
            ? 'production'
            : 'development',
      },
      {
        rootDir: workspaceRoot,
        toolkit,
      },
    );
  },
);
