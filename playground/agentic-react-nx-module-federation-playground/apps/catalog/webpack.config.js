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
      surface: 'nx-catalog-tuning-surface',
      panel: 'nx-catalog-tuning-panel',
      control: 'nx-catalog-tuning-control',
    },
    tokens: {
      panelRadius: '12px',
      controlRadius: '9px',
      primaryButtonBackground: '#be123c',
      primaryButtonColor: '#ffffff',
      panelShadow: '0 24px 72px rgba(190, 18, 60, 0.2)',
    },
    styles: {
      surface: {
        filter: 'drop-shadow(0 18px 40px rgba(190, 18, 60, 0.14))',
      },
      panel: {
        border: '1px solid rgba(190, 18, 60, 0.24)',
      },
      targetTag: {
        background: '#fff1f2',
        color: '#be123c',
      },
      sectionTitle: {
        color: '#be123c',
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
