const { createProjectGraphAsync } = require('@nrwl/devkit');
const webpack = require('webpack');

const rootPackage = require('./package.json');

const sharedVersions = {
  ...rootPackage.dependencies,
  ...rootPackage.devDependencies,
};

const singletonPackages = new Set(['react', 'react-dom', 'react-router-dom']);

const getProjectServePort = (project) => {
  const serve = project?.data?.targets?.serve || project?.targets?.serve;
  const dev = project?.data?.targets?.dev || project?.targets?.dev;
  return serve?.options?.port || dev?.options?.port;
};

const getRemoteDefinition = (remote, graph, isDevelopment) => {
  if (Array.isArray(remote)) {
    const [name, url] = remote;
    return [name, `${name}@${url.replace(/\/$/, '')}/remoteEntry.js`];
  }

  if (!isDevelopment) {
    return [remote, `${remote}@/${remote}/remoteEntry.js`];
  }

  const remoteProject = graph.nodes[remote];
  const port = getProjectServePort(remoteProject);

  if (!port) {
    throw new Error(
      `Cannot resolve module federation remote "${remote}" because its project.json has no serve/dev port.`,
    );
  }

  return [remote, `${remote}@http://127.0.0.1:${port}/remoteEntry.js`];
};

const getSharedConfig = (moduleFederationConfig) => {
  const shared = {};

  for (const packageName of singletonPackages) {
    shared[packageName] = {
      singleton: true,
      strictVersion: true,
      requiredVersion: sharedVersions[packageName],
    };
  }

  if (typeof moduleFederationConfig.shared === 'function') {
    for (const packageName of Object.keys(shared)) {
      shared[packageName] = moduleFederationConfig.shared(
        packageName,
        shared[packageName],
      );
    }
  }

  return shared;
};

const withModuleFederation = async (moduleFederationConfig) => {
  const graph = await createProjectGraphAsync();

  return (config, nxContext = {}) => {
    const isProduction =
      nxContext?.context?.configurationName === 'production' ||
      config.mode === 'production';
    const remotes = Object.fromEntries(
      (moduleFederationConfig.remotes || []).map((remote) =>
        getRemoteDefinition(remote, graph, !isProduction),
      ),
    );
    const projectPort = getProjectServePort(
      graph.nodes[moduleFederationConfig.name],
    );
    const publicPath =
      !isProduction && projectPort
        ? `http://127.0.0.1:${projectPort}/`
        : 'auto';

    return {
      ...config,
      output: {
        ...config.output,
        publicPath,
        scriptType: 'text/javascript',
        uniqueName: moduleFederationConfig.name,
      },
      optimization: {
        ...config.optimization,
        runtimeChunk: false,
      },
      plugins: [
        ...(config.plugins || []),
        new webpack.container.ModuleFederationPlugin({
          name: moduleFederationConfig.name,
          filename: 'remoteEntry.js',
          exposes: moduleFederationConfig.exposes || {},
          remotes,
          shared: getSharedConfig(moduleFederationConfig),
        }),
      ],
    };
  };
};

module.exports = withModuleFederation;
