const path = require('path');
const { getDefaultConfig } = (() => {
  try {
    return require('expo/metro-config');
  } catch (e) {
    try {
      return require('@react-native/metro-config');
    } catch (err) {
      return { getDefaultConfig: (dir) => ({}) };
    }
  }
})();

const config = getDefaultConfig(__dirname);

// Enforce local node_modules only; disable hierarchical lookup to avoid bundling root web deps (React 19)
config.resolver.nodeModulesPaths = [path.resolve(__dirname, 'node_modules')];
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
