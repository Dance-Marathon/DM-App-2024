// // Learn more https://docs.expo.io/guides/customizing-metro
// const { getDefaultConfig } = require('expo/metro-config');

// /** @type {import('expo/metro-config').MetroConfig} */
// const config = getDefaultConfig(__dirname);

// module.exports = config;

const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Add this line to disable the experimental package exports feature.
config.resolver.unstable_enablePackageExports = false;

// An alternative fix for some versions is to add 'cjs' to the source extensions.
config.resolver.sourceExts.push("cjs");

module.exports = config;
