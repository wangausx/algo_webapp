// Shared Docker Configuration for algo_webapp
// This file contains common Docker configuration used by both development and production

const sharedDockerConfig = {
  // Common Docker settings
  docker: {
    // Base images
    baseImages: {
      node: 'node:18-alpine',
      nginx: 'nginx:alpine',
      prometheus: 'prom/prometheus:latest',
      grafana: 'grafana/grafana:latest'
    },

    // Common ports
    ports: {
      frontend: 3000,
      backend: 3003,
      nginx: 80,
      nginxSsl: 443,
      prometheus: 9090,
      grafana: 3003
    },

    // Common volumes
    volumes: {
      source: './src:/app/src',
      public: './public:/app/public',
      build: './build:/app/build',
      nginx: './nginx.conf:/etc/nginx/nginx.conf:ro',
      ssl: './ssl:/etc/nginx/ssl:ro'
    },

    // Common environment variables
    env: {
      NODE_ENV: 'development', // Will be overridden by environment-specific configs
      REACT_APP_DOCKER: 'true',
      HOST: '0.0.0.0'
    }
  },

  // Common health check settings
  healthCheck: {
    interval: '30s',
    timeout: '10s',
    retries: 3,
    startPeriod: '40s'
  },

  // Common restart policies
  restartPolicy: 'unless-stopped',

  // Common network configuration
  network: {
    name: 'trading-network',
    driver: 'bridge',
    subnet: '172.20.0.0/16'
  },

  // Common logging configuration
  logging: {
    driver: 'json-file',
    options: {
      max-size: '10m',
      max-file: '3'
    }
  }
};

module.exports = sharedDockerConfig;
