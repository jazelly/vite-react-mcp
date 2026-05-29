module.exports = {
  name: 'profile',
  exposes: {
    './Routes': './src/app/Routes.tsx',
  },
  shared: (libraryName, defaultConfig) => {
    if (['react', 'react-dom', 'react-router-dom'].includes(libraryName)) {
      return {
        ...defaultConfig,
        singleton: true,
        strictVersion: true,
      };
    }

    return defaultConfig;
  },
};
