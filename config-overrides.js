const { override, addWebpackAlias } = require('customize-cra');
const path = require('path');

// Only import addWebpackDevServerConfig in development
let addWebpackDevServerConfig;
try {
  if (process.env.NODE_ENV === 'development') {
    ({ addWebpackDevServerConfig } = require('customize-cra'));
  }
} catch (e) {
  // Ignore import error in production builds
}

const overrides = [
  addWebpackAlias({
    '@': path.resolve(__dirname, 'src'),
  })
];

// Only add dev server config in development mode
if (process.env.NODE_ENV === 'development' && addWebpackDevServerConfig) {
  overrides.push(
    addWebpackDevServerConfig((config) => {
      // Configure WebSocket for external network access
      config.webSocketServer = 'ws';
      config.allowedHosts = 'all';
      config.client = {
        ...config.client,
        webSocketURL: {
          hostname: '0.0.0.0',
          pathname: '/ws',
          port: 8082,
          protocol: 'ws',
        },
      };
      return config;
    })
  );
}

module.exports = override(...overrides);