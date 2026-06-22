const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const origGetTransformOptions = config.transformer.getTransformOptions;
config.transformer.getTransformOptions = async () => {
  const options = await origGetTransformOptions();
  return {
    ...options,
    transform: {
      ...options.transform,
      inlineRequires: true,
    },
  };
};

module.exports = config;
