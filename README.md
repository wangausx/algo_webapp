# Algo Trading WebApp

A React-based algorithmic trading web application with real-time data visualization and trading capabilities.

## 🚀 Quick Start

### Prerequisites

- WSL2 with Ubuntu 22.04
- Native Docker Engine (not Docker Desktop)
- Node.js 18+

### Development Environment

```bash
# Start development environment (port 8080)
npm run docker:dev:home

# Access your application
# URL: http://localhost:8080
```

### Production Environment

```bash
# Start production environment (port 3000)
npm run docker:home

# Access your application
# URL: http://localhost:3000
```

## 📋 Available Scripts

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

### Docker Commands

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
```

## 🏗️ Architecture

### Development Environment
```
┌─────────────────┐
│  React Dev      │
│  Server (8080)  │
└─────────────────┘
```

### Production Environment
```
┌─────────────────┐    ┌─────────────────┐
│   Nginx (3000)  │───▶│  React App      │
│   (Frontend)    │    │   (Static)      │
└─────────────────┘    └─────────────────┘
```

## ⚡ Performance Benefits

This project uses **native Docker Engine in WSL2** for optimal performance:

- **CPU Usage**: ~8-13% reduction in overhead
- **Memory Usage**: ~1-1.5GB RAM saved
- **Startup Time**: 2-3x faster container startup
- **Build Times**: 30-50% faster builds

## 🔧 Configuration

### Port Configuration

| Environment | Container Port | Host Port | URL |
|-------------|----------------|-----------|-----|
| Development | 3000 | 8080 | http://localhost:8080 |
| Production | 80 | 3000 | http://localhost:3000 |

### Environment Variables

#### Development Environment
```yaml
environment:
  - NODE_ENV=development
  - REACT_APP_DOCKER=true
  - REACT_APP_API_URL=http://192.168.1.143:3001
  - DANGEROUSLY_DISABLE_HOST_CHECK=true
```

#### Production Environment
```yaml
environment:
  - NODE_ENV=production
  - REACT_APP_API_URL=http://192.168.1.143:3000
  - REACT_APP_DOCKER=true
```

## 🛠️ Migration from Docker Desktop

If you're migrating from Docker Desktop:

1. **Stop Docker Desktop** completely
2. **Restart your computer** to clear all processes
3. **Use native Docker** commands as shown above
4. **Disable Docker Desktop auto-start** to prevent conflicts

## 📚 Documentation

- [Docker Setup Guide](DOCKER-SETUP.md) - Complete Docker configuration
- [Docker Deployment Guide](README-Docker.md) - Deployment instructions
- [Home Network Setup](HOME-NETWORK-SETUP.md) - Home server configuration
- [External Access Guide](EXTERNAL-ACCESS-GUIDE.md) - External access setup

## 🔍 Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check what's using the port
sudo lsof -i :8080

# Kill processes using the port
sudo fuser -k 8080/tcp
```

#### Docker Daemon Issues
```bash
# Restart Docker daemon
sudo systemctl restart docker

# Check Docker status
sudo systemctl status docker
```

#### WSL2 Integration Issues
```bash
# Restart WSL2
wsl --shutdown

# Restart your terminal and try again
```

## 📊 Monitoring

### Container Resources
```bash
# Check container resource usage
docker stats

# Check system resources
htop
```

### Docker Daemon
```bash
# Check Docker daemon logs
sudo journalctl -u docker.service -f

# Check Docker daemon status
sudo systemctl status docker
```

## 🔒 Security

### Docker Security
1. **Keep Docker updated**: Regularly update Docker Engine
2. **Use non-root containers**: Run containers as non-root users
3. **Scan images**: Use `docker scan` to check for vulnerabilities
4. **Limit resources**: Set memory and CPU limits

### Network Security
1. **Use custom networks**: Isolate containers with custom networks
2. **Expose minimal ports**: Only expose necessary ports
3. **Use reverse proxy**: Use nginx for production deployments

## 🚀 Deployment

### Home Server Deployment
```bash
# Deploy to home server
./deploy.sh home start

# Check status
./deploy.sh home status

# View logs
./deploy.sh home logs

# Stop services
./deploy.sh home stop
```

### Cloud Deployment
```bash
# Deploy to cloud environment
./deploy.sh cloud start

# Check status
./deploy.sh cloud status
```

## 📦 Backup and Restore

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

## 🧹 Maintenance

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

## 🤝 Support

For issues related to:
- **Native Docker**: Check Docker Engine logs
- **WSL2**: Restart WSL2 environment
- **Port conflicts**: Use different ports or kill conflicting processes
- **Performance**: Monitor with `docker stats` and `htop`

## 📈 Performance Comparison

| Feature | Native Docker | Docker Desktop |
|---------|---------------|----------------|
| CPU Usage | ~5-10% | ~15-25% |
| Memory Usage | ~1-2GB | ~3-4GB |
| Startup Time | ~10-20s | ~30-60s |
| File I/O | Native speed | Virtualized |
| Resource Overhead | Minimal | Significant |
| WSL2 Integration | Direct | Bridge layer |

## 🎯 Best Practices

1. **Use native Docker** for better performance
2. **Disable Docker Desktop** auto-start to prevent conflicts
3. **Monitor resource usage** regularly
4. **Keep images updated** for security
5. **Use health checks** for production deployments
6. **Backup important data** regularly
7. **Test in development** before production deployment

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
