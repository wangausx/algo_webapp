# Docker Setup Guide

## Overview

This project uses **native Docker Engine in WSL2** for optimal performance and resource efficiency. The setup has been migrated from Docker Desktop to native Docker to reduce CPU and memory overhead.

## Performance Benefits

- **CPU Usage**: ~8-13% reduction in overhead
- **Memory Usage**: ~1-1.5GB RAM saved
- **Startup Time**: 2-3x faster container startup
- **Build Times**: 30-50% faster builds

## Prerequisites

- WSL2 with Ubuntu 22.04
- Native Docker Engine (not Docker Desktop)
- Node.js 18+

## Quick Start

### 1. Start Development Environment

```bash
# Start the development environment
npm run docker:dev:home

# Or use docker compose directly
docker compose -f docker-compose.dev.home.yml up --build
```

### 2. Access Your Application

- **URL**: http://localhost:8080
- **Port**: 8080 (mapped from container port 3000)

### 3. Stop Environment

```bash
# Stop all containers
npm run docker:stop

# Or use docker compose directly
docker compose -f docker-compose.dev.home.yml down
```

## Available Scripts

### Development Scripts

```bash
# Start development environment (port 8080)
npm run docker:dev:home

# Start production environment
npm run docker:home

# View logs
npm run docker:logs

# Stop all containers
npm run docker:stop
```

### Build Scripts

```bash
# Build development image
npm run docker:build:dev

# Build production image
npm run docker:build
```

## Docker Compose Files

### Development Environment (`docker-compose.dev.home.yml`)

- **Port**: 8080:3000
- **Environment**: Development with hot reloading
- **Volumes**: Source code mounted for live updates
- **API URL**: http://192.168.1.143:3001

### Production Environment (`docker-compose.home.yml`)

- **Port**: 3000:80 (via nginx)
- **Environment**: Production optimized
- **API URL**: http://192.168.1.143:3000

## Native Docker vs Docker Desktop

### Benefits of Native Docker

1. **Lower Resource Usage**
   - ~8-13% CPU reduction
   - ~1-1.5GB RAM savings
   - Faster startup times

2. **Better Performance**
   - Direct Linux kernel access
   - No virtualization overhead
   - Faster file I/O operations

3. **Simplified Architecture**
   - WSL2 → Docker Engine → Containers
   - No intermediate layers

### Migration Notes

- **Command Change**: Use `docker compose` instead of `docker-compose`
- **Port Change**: Development now uses port 8080 instead of 3000
- **Docker Desktop**: Can be kept installed but disabled for auto-start

## Troubleshooting

### Port Conflicts

If you encounter port binding errors:

```bash
# Check what's using the port
sudo lsof -i :8080

# Kill processes using the port
sudo fuser -k 8080/tcp
```

### Docker Daemon Issues

```bash
# Restart Docker daemon
sudo systemctl restart docker

# Check Docker status
sudo systemctl status docker
```

### WSL2 Integration

If Docker commands fail:

```bash
# Restart WSL2
wsl --shutdown

# Restart your terminal and try again
```

## Environment Variables

### Development Environment

```yaml
environment:
  - NODE_ENV=development
  - REACT_APP_DOCKER=true
  - REACT_APP_API_URL=http://192.168.1.143:3001
  - DANGEROUSLY_DISABLE_HOST_CHECK=true
```

### Production Environment

```yaml
environment:
  - NODE_ENV=production
  - REACT_APP_API_URL=http://192.168.1.143:3000
  - REACT_APP_DOCKER=true
```

## Network Configuration

The application uses a custom bridge network:

```yaml
networks:
  trading-network:
    driver: bridge
```

## Volume Mounts

Development environment mounts source code for hot reloading:

```yaml
volumes:
  - ./src:/app/src
  - ./public:/app/public
```

## Health Checks

Production environment includes health checks:

```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

## Performance Monitoring

Monitor resource usage:

```bash
# Check container resource usage
docker stats

# Check system resources
htop
```

## Backup and Restore

### Backup Images

```bash
# Backup important images
docker save -o backup-images.tar algo-trading-app-home-frontend:latest backend-backend:latest

# Restore images
docker load -i backup-images.tar
```

## Migration from Docker Desktop

If you're migrating from Docker Desktop:

1. **Stop Docker Desktop** completely
2. **Restart your computer** to clear all Docker Desktop processes
3. **Use native Docker** commands as shown above
4. **Disable Docker Desktop auto-start** to prevent conflicts

## Support

For issues related to:
- **Native Docker**: Check Docker Engine logs
- **WSL2**: Restart WSL2 environment
- **Port conflicts**: Use different ports or kill conflicting processes
- **Performance**: Monitor with `docker stats` and `htop` 