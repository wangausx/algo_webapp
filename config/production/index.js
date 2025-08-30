// Production Configuration Index
// This file exports all production configuration settings

const productionConfig = {
  // Environment settings
  NODE_ENV: 'production',
  REACT_APP_DOCKER: true,
  REACT_APP_API_URL_AUTO: true,
  
  // Backend API Configuration
  REACT_APP_API_URL_LOCALHOST: 'http://localhost:3003',
  REACT_APP_API_URL_HOME: 'http://192.168.1.143:3003',
  REACT_APP_API_URL_EXTERNAL: 'http://107.137.66.174:3003',
  REACT_APP_API_URL_DDNS: 'http://autotrade.mywire.org:3003',
  
  // Docker Configuration
  COMPOSE_PROJECT_NAME: 'algo-trading-app-prod',
  
  // Production Build Configuration
  GENERATE_SOURCEMAP: false,
  INLINE_RUNTIME_CHUNK: false,
  
  // Security Configuration
  DANGEROUSLY_DISABLE_HOST_CHECK: false,
  
  // WebSocket Configuration
  WDS_SOCKET_HOST: '0.0.0.0',
  WDS_SOCKET_PORT: 3000,
  WDS_SOCKET_PATH: '/ws',
  WDS_SOCKET_PROTOCOL: 'ws',
  
  // Host Configuration
  HOST: '0.0.0.0',
  PORT: 3000,
  
  // File paths
  DOCKER_COMPOSE_FILE: 'config/production/docker-compose.production.yml',
  NGINX_CONFIG_FILE: 'config/production/nginx.production.conf',
  PROMETHEUS_CONFIG_FILE: 'config/production/prometheus.production.yml',
  ENV_FILE: 'config/production/env.production'
};

module.exports = productionConfig;
