const {getDefaultConfig} = require('expo/metro-config');
const {FileStore} = require('metro-cache');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// SQLite bundled assets
if (!config.resolver.assetExts.includes('db')) {
  config.resolver.assetExts.push('db');
}

// Optional: custom Metro cache location
config.cacheStores = [
  new FileStore({
    root: path.join(__dirname, '.metro-cache'),
    isRoot: true,
  }),
];

module.exports = config;
