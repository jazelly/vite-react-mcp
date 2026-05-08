module.exports = {
  name: 'shell',
  remotes: ['catalog', 'profile'],
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
