# Deployment Configuration Guide

This guide explains how to configure the application for both local development and Docker deployment.

## Environment Configuration

### Local Development

For local development, use these environment variables:

```bash
# .env.development (create this file)
NODE_ENV=development
REACT_APP_DOCKER=false
REACT_APP_API_URL=http://localhost:3000

# Backend Configuration
PORT=3001
DATABASE_URL=your_database_url_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

**Commands for local development:**
```bash
# Start frontend with development config
npm run start:dev

# Start backend (in separate terminal)
cd ../backend
npm run dev
```

### Docker Development

For Docker-based development testing:

```bash
# .env.docker.dev (create this file)
NODE_ENV=development
REACT_APP_DOCKER=true
REACT_APP_API_URL=http://localhost:3000

# Backend Configuration
PORT=3001
DATABASE_URL=your_database_url_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

**Commands for Docker development:**
```bash
# Start development environment with Docker
npm run docker:dev

# Build development Docker image
npm run docker:build:dev
```

### Docker Production

For production Docker deployment:

```bash
# .env.docker.prod (create this file)
NODE_ENV=production
REACT_APP_DOCKER=true
REACT_APP_API_URL=http://localhost:3000

# Backend Configuration
PORT=3001
DATABASE_URL=your_database_url_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

**Commands for Docker production:**
```bash
# Start production environment with Docker
npm run docker:prod

# Build production Docker image
npm run docker:build
```

## API Configuration Logic

The application automatically detects the environment and configures API endpoints:

### Local Development
- **API Base URL**: `http://localhost:3001`
- **WebSocket URL**: `ws://localhost:3001`
- **Environment**: `NODE_ENV=development`, `REACT_APP_DOCKER=false`

### Docker Development
- **API Base URL**: `http://localhost:3001`
- **WebSocket URL**: `ws://localhost:3001`
- **Environment**: `NODE_ENV=development`, `REACT_APP_DOCKER=true`

### Docker Production
- **API Base URL**: Relative paths (proxied through nginx)
- **WebSocket URL**: `ws://your-domain.com` (proxied through nginx)
- **Environment**: `NODE_ENV=production`, `REACT_APP_DOCKER=true`

## Nginx Configuration

The nginx configuration handles:
- **API Proxy**: `/api/*` → `backend:3001`
- **WebSocket Proxy**: `/ws/*` → `backend:3001`
- **Router Proxy**: `/router/*` → `backend:3001/router/`
- **Static Files**: Serves React build files

## Testing Different Environments

### Test Local Development
```bash
# Terminal 1: Start backend
cd ../backend
npm run dev

# Terminal 2: Start frontend
npm run start:dev
```

### Test Docker Development
```bash
# Start development Docker environment
npm run docker:dev

# Access at http://localhost:3000
```

### Test Docker Development on Home Network
```bash
# Start development Docker environment on home network
npm run docker:dev:home

# Access at http://192.168.1.143:3000
```

### Test Docker Production
```bash
# Start production Docker environment
npm run docker:prod

# Access at http://localhost:3000
```

### Test Docker Home Production
```bash
# Start production Docker environment on home network
npm run docker:home

# Access at http://192.168.1.143:3000
```

## Environment Variables Summary

| Environment | NODE_ENV | REACT_APP_DOCKER | API Base | WebSocket URL | Access URL |
|-------------|----------|------------------|----------|---------------|------------|
| Local Dev   | development | false | localhost:3001 | ws://localhost:3001 | localhost:3000 |
| Docker Dev  | development | true | localhost:3001 | ws://localhost:3001 | localhost:3000 |
| Docker Dev Home | development | true | localhost:3001 | ws://localhost:3001 | 192.168.1.143:3000 |
| Docker Prod | production | true | relative | ws://host | localhost:3000 |
| Docker Home | production | true | relative | ws://host | 192.168.1.143:3000 |

## Troubleshooting

### WebSocket Connection Issues
1. Check environment variables are set correctly
2. Verify backend is running with WebSocket support
3. Check browser console for connection errors
4. Ensure nginx is properly configured for WebSocket proxying

### API Connection Issues
1. Verify backend is running on correct port
2. Check CORS configuration in backend
3. Ensure API endpoints are accessible
4. Check nginx proxy configuration

### Docker Issues
1. Ensure Docker and Docker Compose are installed
2. Check container logs: `docker-compose logs -f`
3. Verify environment variables in docker-compose.yml
4. Ensure ports are not already in use 