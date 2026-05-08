const webpack = require('webpack');

const allowedEnvPrefixes = ['REACT_APP_', 'NX_'];

const getAllowedEnvironment = () => {
  const definitions = {
    'process.env.NODE_ENV': JSON.stringify(
      process.env.NODE_ENV || 'development',
    ),
  };

  for (const [key, value] of Object.entries(process.env)) {
    if (allowedEnvPrefixes.some((prefix) => key.startsWith(prefix))) {
      definitions[`process.env.${key}`] = JSON.stringify(value);
    }
  }

  return definitions;
};

const replaceDefinePlugin = (config) => ({
  ...config,
  plugins: [
    ...(config.plugins || []).filter(
      (plugin) => plugin?.constructor?.name !== 'DefinePlugin',
    ),
    new webpack.DefinePlugin(getAllowedEnvironment()),
  ],
});

module.exports = {
  replaceDefinePlugin,
};
