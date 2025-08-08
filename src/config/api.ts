// API Configuration for different environments
interface ApiConfig {
  baseUrl: string;
  wsUrl: string;
}

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development';
const isDocker = process.env.REACT_APP_DOCKER === 'true';
const isProduction = process.env.NODE_ENV === 'production';

// Check if we're running locally (for debugging purposes)
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Configuration based on environment
const getApiConfig = (): ApiConfig => {
  // Check if REACT_APP_API_URL is set (for Docker/containerized environments)
  const customApiUrl = process.env.REACT_APP_API_URL;
  if (customApiUrl) {
    console.log('Using custom API URL:', customApiUrl);
    // For development with proxy, always use relative URLs to go through the proxy
    if (isDevelopment) {
      console.log('Using proxy for development');
      return {
        baseUrl: '', // Empty baseUrl means relative URLs will go through proxy
        wsUrl: `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://localhost:3001` // WebSocket connects directly to backend
      };
    }
    // Extract host and port from the API URL for WebSocket
    const apiUrl = new URL(customApiUrl);
    return {
      baseUrl: customApiUrl,
      wsUrl: `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${apiUrl.host}`
    };
  }
  
  // Docker deployment (containerized environment)
  if (isDocker) {
    console.log('Using Docker API config (empty baseUrl)');
    console.log('isDocker:', isDocker, 'window.location.host:', window.location.host);
    return {
      baseUrl: '',
      wsUrl: `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://localhost:3001`
    };
  }
  
  // Local development (localhost)
  if (isDevelopment || isLocalhost) {
    console.log('Using localhost API config');
    return {
      baseUrl: 'http://localhost:3001',
      wsUrl: `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://localhost:3001`
    };
  }
  
  // Production build (non-containerized)
  if (isProduction) {
    console.log('Using production API config');
    return {
      baseUrl: '',
      wsUrl: `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://localhost:3001`
    };
  }
  
  // Fallback for any other case
  console.log('Using fallback API config');
  return {
    baseUrl: 'http://localhost:3001',
    wsUrl: `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://localhost:3001`
  };
};

export const apiConfig = getApiConfig();

// Debug logging (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('API Configuration:', {
    isDevelopment,
    isDocker,
    isProduction,
    isLocalhost,
    nodeEnv: process.env.NODE_ENV,
    reactAppDocker: process.env.REACT_APP_DOCKER,
    windowLocation: {
      protocol: window.location.protocol,
      host: window.location.host,
      hostname: window.location.hostname,
      port: window.location.port
    },
    apiConfig
  });
}

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${apiConfig.baseUrl}${cleanEndpoint}`;
};

// Helper function to build WebSocket URL
export const buildWsUrl = (): string => {
  console.log('buildWsUrl called, returning:', apiConfig.wsUrl);
  return apiConfig.wsUrl;
};

export default apiConfig; 