const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Firebase Auth on Expo/RN may load .cjs internals that Metro must resolve.
if (!config.resolver.sourceExts.includes('cjs')) {
  config.resolver.sourceExts.push('cjs');
}

config.resolver.unstable_enablePackageExports = false;

module.exports = config;
