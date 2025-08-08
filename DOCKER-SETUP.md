# Docker Setup Guide

## Overview

This project has been migrated from Docker Desktop to **native Docker Engine in WSL2** for optimal performance and resource efficiency.

## Performance Benefits

- **CPU Usage**: ~8-13% reduction in overhead
- **Memory Usage**: ~1-1.5GB RAM saved
- **Startup Time**: 2-3x faster container startup
- **Build Times**: 30-50% faster builds

## Prerequisites

- WSL2 with Ubuntu 22.04
- Native Docker Engine (not Docker Desktop)
- Docker Compose plugin

## Installation

### 1. Install Native Docker Engine

```bash
# Update package index
sudo apt update

# Install prerequisites
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add your user to docker group
sudo usermod -aG docker $USER

# Start and enable Docker service
sudo systemctl enable docker
sudo systemctl start docker
```

### 2. Verify Installation

```bash
# Check Docker version
docker --version

# Check Docker Compose version
docker compose version

# Test Docker
docker run hello-world
```

## Quick Start

### Development Environment

```bash
# Start development environment (port 8080)
npm run docker:dev:home

# Or use docker compose directly
docker compose -f docker-compose.dev.home.yml up --build
```

### Production Environment

```bash
# Start production environment (port 3000)
npm run docker:home

# Or use docker compose directly
docker compose -f docker-compose.home.yml up -d --build
```

## Available Commands

### Development Commands

```bash
# Start development environment
npm run docker:dev:home

# Start production environment
npm run docker:home

# View logs
npm run docker:logs

# Stop all containers
npm run docker:stop
```

### Docker Compose Commands

```bash
# Start development (port 8080)
docker compose -f docker-compose.dev.home.yml up --build

# Start production (port 3000)
docker compose -f docker-compose.home.yml up -d --build

# View logs
docker compose -f docker-compose.dev.home.yml logs -f

# Stop services
docker compose -f docker-compose.dev.home.yml down
```

### Deployment Script

```bash
# Start home deployment
./deploy.sh home start

# Stop home deployment
./deploy.sh home stop

# Check status
./deploy.sh home status

# View logs
./deploy.sh home logs

# Restart services
./deploy.sh home restart

# Clean up resources
./deploy.sh home cleanup
```

## Port Configuration

### Development Environment
- **Container Port**: 3000
- **Host Port**: 8080
- **URL**: http://localhost:8080

### Production Environment
- **Container Port**: 80 (via nginx)
- **Host Port**: 3000
- **URL**: http://localhost:3000

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

## Migration from Docker Desktop

### Step 1: Stop Docker Desktop
1. Quit Docker Desktop completely
2. Restart your computer to clear all processes
3. Disable Docker Desktop auto-start

### Step 2: Install Native Docker
Follow the installation steps above

### Step 3: Test Native Docker
```bash
docker --version
docker compose version
docker run hello-world
```

### Step 4: Update Commands
- Use `docker compose` instead of `docker-compose`
- Use port 8080 for development instead of 3000

## Troubleshooting

### Docker Daemon Issues

```bash
# Restart Docker daemon
sudo systemctl restart docker

# Check Docker status
sudo systemctl status docker

# Check Docker info
docker info
```

### Port Conflicts

```bash
# Check what's using the port
sudo lsof -i :8080

# Kill processes using the port
sudo fuser -k 8080/tcp
```

### Permission Issues

```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in, or restart WSL2
wsl --shutdown
```

### WSL2 Integration Issues

```bash
# Restart WSL2
wsl --shutdown

# Restart your terminal and try again
```

## Performance Monitoring

### Monitor Container Resources

```bash
# Check container resource usage
docker stats

# Check system resources
htop
```

### Monitor Docker Daemon

```bash
# Check Docker daemon logs
sudo journalctl -u docker.service -f

# Check Docker daemon status
sudo systemctl status docker
```

## Backup and Restore

### Backup Images

```bash
# Backup important images
docker save -o backup-images.tar algo-trading-app-home-frontend:latest backend-backend:latest

# Restore images
docker load -i backup-images.tar
```

### Backup Volumes

```bash
# List volumes
docker volume ls

# Backup specific volume
docker run --rm -v trading-network_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .

# Restore volume
docker run --rm -v trading-network_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_backup.tar.gz -C /data
```

## Security Considerations

### Docker Security

1. **Keep Docker updated**: Regularly update Docker Engine
2. **Use non-root containers**: Run containers as non-root users
3. **Scan images**: Use `docker scan` to check for vulnerabilities
4. **Limit resources**: Set memory and CPU limits

### Network Security

1. **Use custom networks**: Isolate containers with custom networks
2. **Expose minimal ports**: Only expose necessary ports
3. **Use reverse proxy**: Use nginx for production deployments

## Maintenance

### Regular Maintenance

```bash
# Update images
docker compose pull

# Clean up unused resources
docker system prune -f

# Restart services
./deploy.sh home restart
```

### Updates

1. Pull latest code
2. Update environment variables if needed
3. Rebuild and restart services
4. Test functionality
5. Monitor logs for errors

## Support

For issues related to:
- **Native Docker**: Check Docker Engine logs
- **WSL2**: Restart WSL2 environment
- **Port conflicts**: Use different ports or kill conflicting processes
- **Performance**: Monitor with `docker stats` and `htop`

## Comparison: Native Docker vs Docker Desktop

| Feature | Native Docker | Docker Desktop |
|---------|---------------|----------------|
| CPU Usage | ~5-10% | ~15-25% |
| Memory Usage | ~1-2GB | ~3-4GB |
| Startup Time | ~10-20s | ~30-60s |
| File I/O | Native speed | Virtualized |
| Resource Overhead | Minimal | Significant |
| WSL2 Integration | Direct | Bridge layer |
| Cost | Free | Free (personal) |
| Updates | Package manager | Desktop app |

## Best Practices

1. **Use native Docker** for better performance
2. **Disable Docker Desktop** auto-start to prevent conflicts
3. **Monitor resource usage** regularly
4. **Keep images updated** for security
5. **Use health checks** for production deployments
6. **Backup important data** regularly
7. **Test in development** before production deployment 