// Shared API Configuration for algo_webapp
// This file contains common API configuration used by both development and production

const sharedApiConfig = {
  // Common API endpoints
  endpoints: {
    health: '/health',
    api: '/api',
    websocket: '/ws',
    router: '/router'
  },

  // Common API settings
  settings: {
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
    maxConcurrentRequests: 10
  },

  // Common headers
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },

  // WebSocket configuration
  websocket: {
    reconnectInterval: 5000, // 5 seconds
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000 // 30 seconds
  },

  // Error handling
  errorCodes: {
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
    AUTH_ERROR: 'AUTH_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    SERVER_ERROR: 'SERVER_ERROR'
  }
};

module.exports = sharedApiConfig;
