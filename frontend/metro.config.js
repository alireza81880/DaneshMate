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

module.exports = config;
