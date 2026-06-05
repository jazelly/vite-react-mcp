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
      surface: 'nx-profile-tuning-surface',
      panel: 'nx-profile-tuning-panel',
      control: 'nx-profile-tuning-control',
    },
    tokens: {
      panelRadius: '12px',
      controlRadius: '9px',
      primaryButtonBackground: '#0f766e',
      primaryButtonColor: '#ffffff',
      panelShadow: '0 24px 72px rgba(15, 118, 110, 0.22)',
    },
    styles: {
      surface: {
        filter: 'drop-shadow(0 18px 40px rgba(15, 118, 110, 0.15))',
      },
      panel: {
        border: '1px solid rgba(15, 118, 110, 0.24)',
      },
      targetTag: {
        background: '#ecfeff',
        color: '#0f766e',
      },
      sectionTitle: {
        color: '#0f766e',
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
