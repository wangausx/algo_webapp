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
  // Docker deployment (containerized environment) - PRIORITY 1
  if (isDocker) {
    console.log('Using Docker API config (Docker environment detected)');
    console.log('isDocker:', isDocker, 'window.location.host:', window.location.host);
    
    // Check if we're accessing from outside the Docker network (browser)
    // vs inside the Docker network (container-to-container)
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
    
    const isInternalIP = window.location.hostname.includes('192.168.1.143');
    
    // PRIORITY: Localhost access should always use localhost:3003 for both API and WebSocket
    if (isLocalhost) {
      console.log('Localhost access detected - using environment variable for API calls (browser access)');
      // When accessed from localhost, use the environment variable since backend is exposed on host ports
      const customApiUrl = process.env.REACT_APP_API_URL;
      if (customApiUrl) {
        console.log('Using REACT_APP_API_URL for localhost access:', customApiUrl);
        return {
          baseUrl: customApiUrl,
          wsUrl: customApiUrl.replace('http://', 'ws://').replace('https://', 'wss://')
        };
      } else {
        console.log('No REACT_APP_API_URL found, falling back to localhost:3003');
        return {
          baseUrl: 'http://localhost:3003',  // Backend exposed on localhost:3003
          wsUrl: 'ws://localhost:3003'       // WebSocket also on localhost:3003
        };
      }
    } else if (isInternalIP) {
      console.log('Internal network access detected - using internal IP for API calls');
      // When accessed from internal network, use internal IP
      return {
        baseUrl: 'http://192.168.1.143:3003',
        wsUrl: 'ws://192.168.1.143:3003'
      };
    } else {
      console.log('External access detected - using external IP for API calls');
      // When accessed from external IP (like 107.137.66.174), use the same hostname
      // but with the backend port (3003)
      const externalHost = window.location.hostname;
      return {
        baseUrl: `http://${externalHost}:3003`,  // Backend exposed on external IP:3003
        wsUrl: `ws://${externalHost}:3003`       // WebSocket also on external IP:3003
      };
    }
  }
  
  // Check if we have a custom API URL from environment - PRIORITY 2
  const customApiUrl = process.env.REACT_APP_API_URL;
  
  if (customApiUrl) {
    console.log('Using custom API URL:', customApiUrl);
    
    // Extract host and port from the API URL for WebSocket
    const apiUrl = new URL(customApiUrl);
    
    // For external access, use the API URL host for both API and WebSocket
    // This ensures consistent routing through the same network path
    const isExternalAccess = !window.location.hostname.includes('192.168.1.143') && !window.location.hostname.includes('localhost');
    
    if (isExternalAccess) {
      console.log('External access detected - using internal IP for API due to NAT hairpinning limitations');
      console.log('API URL host:', apiUrl.hostname, 'Current location:', window.location.hostname);
      // For external access, use internal IP because router doesn't support NAT hairpinning
      // Frontend is accessed via external IP but API calls should go to internal IP
      return {
        baseUrl: `http://${apiUrl.hostname}:3003`,
        wsUrl: `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${apiUrl.hostname}:3003`
      };
    }
    
    return {
      baseUrl: customApiUrl,
      wsUrl: `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${apiUrl.hostname}:${apiUrl.port || '3003'}`
    };
  }
  
  // Local development (localhost) - PRIORITY 3
  if (isDevelopment || isLocalhost) {
    console.log('Using localhost API config (local development)');
    return {
      baseUrl: 'http://localhost:3001',
      wsUrl: `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://localhost:3001`
    };
  }
  
  // Production build (non-containerized) - PRIORITY 4
  if (isProduction) {
    console.log('Using production API config');
    // For production, use the same host as the current page
    const wsHost = window.location.hostname;
    const wsPort = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
    return {
      baseUrl: '',
      wsUrl: `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${wsHost}:${wsPort}`
    };
  }
  
  // Fallback for any other case - PRIORITY 5
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
    reactAppApiUrl: process.env.REACT_APP_API_URL,
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
  console.log('Current window.location:', {
    protocol: window.location.protocol,
    host: window.location.host,
    hostname: window.location.hostname,
    port: window.location.port
  });
  return apiConfig.wsUrl;
};

export default apiConfig; 