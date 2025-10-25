const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  watchFolders: [],
  resolver: {
    unstable_enableSymlinks: false,
    blockList: [
      // Exclude ios build directory
      /ios\/build\/.*/,
      // Exclude android build directories
      /android\/\.gradle\/.*/,
      /android\/app\/build\/.*/,
      /android\/build\/.*/,
    ],
  },
  transformer: {
    unstable_allowRequireContext: false,
  },
  maxWorkers: 2,
  server: {
    port: 8081,
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
