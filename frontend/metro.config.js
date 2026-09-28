const path = require('path');
const fs = require('fs');
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

// Configure module resolution paths: include frontend/node_modules and fallback to monorepo root node_modules
const frontendModules = path.resolve(__dirname, 'node_modules');
const rootModules = path.resolve(__dirname, '..', 'node_modules');

const nodeModulesPaths = [frontendModules];
if (fs.existsSync(rootModules)) {
  nodeModulesPaths.push(rootModules);
}

config.resolver.nodeModulesPaths = nodeModulesPaths;
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
