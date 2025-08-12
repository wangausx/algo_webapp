const { override, addWebpackAlias, addWebpackDevServerConfig } = require('customize-cra');
const path = require('path');

module.exports = override(
  addWebpackAlias({
    '@': path.resolve(__dirname, 'src'),
  }),
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