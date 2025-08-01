// API Configuration for different environments
interface ApiConfig {
  baseUrl: string;
  wsUrl: string;
}

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development';
const isDocker = process.env.REACT_APP_DOCKER === 'true';

// Configuration based on environment
const getApiConfig = (): ApiConfig => {
  if (isDocker) {
    // Containerized environment - use relative paths
    return {
      baseUrl: '',
      wsUrl: `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`
    };
  } else if (isDevelopment) {
    // Local development - use localhost:3001
    return {
      baseUrl: 'http://localhost:3001',
      wsUrl: `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://localhost:3001`
    };
  } else {
    // Production build - use relative paths
    return {
      baseUrl: '',
      wsUrl: `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`
    };
  }
};

export const apiConfig = getApiConfig();

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${apiConfig.baseUrl}${cleanEndpoint}`;
};

// Helper function to build WebSocket URL
export const buildWsUrl = (): string => {
  return apiConfig.wsUrl;
};

export default apiConfig; 