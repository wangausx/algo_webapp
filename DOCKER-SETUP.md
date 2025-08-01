# Docker Containerization Setup for Algo Trading WebApp

## Overview

Your React trading application has been successfully containerized for deployment on both home servers and cloud environments. This setup provides a complete production-ready Docker configuration with development and production environments.

## What Has Been Created

### 1. Docker Configuration Files

- **`Dockerfile`** - Production build for React app with nginx
- **`Dockerfile.dev`** - Development build with hot reloading
- **`docker-compose.yml`** - Basic production orchestration
- **`docker-compose.dev.yml`** - Development environment
- **`docker-compose.prod.yml`** - Full production setup with database and monitoring
- **`nginx.conf`** - Nginx configuration with API proxying and WebSocket support
- **`.dockerignore`** - Excludes unnecessary files from build context

### 2. Deployment Scripts

- **`deploy.sh`** - Automated deployment script for home/cloud environments
- **`env.example`** - Environment variables template
- **`backend.Dockerfile.example`** - Example backend Dockerfile

### 3. Database and Monitoring

- **`init-db.sql`** - PostgreSQL database initialization
- **`prometheus.yml`** - Monitoring configuration
- **`README-Docker.md`** - Comprehensive Docker deployment guide

### 4. Updated Application Code

The React application has been updated to work with containerized environments:

- ✅ Removed hardcoded `localhost:3001` references
- ✅ Updated API calls to use relative paths
- ✅ Updated WebSocket connections to work with nginx proxy
- ✅ Added Docker-specific npm scripts

## Current Status

### ✅ Completed
- Frontend containerization
- Nginx reverse proxy configuration
- API endpoint routing
- WebSocket proxy setup
- Development and production Dockerfiles
- Deployment automation scripts
- Database schema and initialization
- Monitoring setup (Prometheus/Grafana)
- Health checks for all services

### ⚠️ Requires Your Action
- **Backend Service**: You need to provide your backend service
- **Environment Variables**: Configure your API keys and database URLs
- **SSL Certificate**: Set up HTTPS for production
- **Domain Configuration**: Configure your domain names

## Quick Start Guide

### 1. Development Environment

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up --build

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

### 2. Production Environment

```bash
# Copy environment template
cp env.example .env

# Edit environment variables
nano .env

# Deploy to home server
./deploy.sh home start

# Or deploy to cloud
./deploy.sh cloud start
```

### 3. Full Production Setup (with database)

```bash
# Use the full production compose file
docker-compose -f docker-compose.prod.yml up -d

# With monitoring
docker-compose -f docker-compose.prod.yml --profile monitoring up -d

# With SSL
docker-compose -f docker-compose.prod.yml --profile ssl up -d
```

## Architecture

### Development Setup
```
┌─────────────────┐    ┌─────────────────┐
│  React Dev      │    │   Backend Dev   │
│  Server (3000)  │    │   Server (3001) │
└─────────────────┘    └─────────────────┘
```

### Production Setup
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx (80)    │───▶│  React App      │    │   Backend       │
│   (Frontend)    │    │   (Static)      │    │   (3001)        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Full Production Setup
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx (80)    │───▶│  React App      │    │   Backend       │    │   PostgreSQL    │
│   (Frontend)    │    │   (Static)      │    │   (3001)        │    │   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                                              │
                                └─────────────── Redis Cache ──────────────────┘
```

## Next Steps

### 1. Backend Service Setup

You need to create or provide your backend service. Options:

**Option A: Use existing backend**
```yaml
# In docker-compose.yml
backend:
  image: your-backend-image:latest
```

**Option B: Build from source**
```yaml
# In docker-compose.yml
backend:
  build:
    context: ../backend
    dockerfile: Dockerfile
```

### 2. Environment Configuration

Create a `.env` file:
```bash
cp env.example .env
nano .env
```

Required variables:
- `ANTHROPIC_API_KEY` - Your Anthropic API key
- `POSTGRES_PASSWORD` - Database password
- `DATABASE_URL` - Database connection string

### 3. SSL/HTTPS Setup

For production, set up SSL certificates:

```bash
# Create SSL directory
mkdir ssl

# Add your certificates
cp your-cert.pem ssl/
cp your-key.pem ssl/

# Start with SSL profile
docker-compose -f docker-compose.prod.yml --profile ssl up -d
```

### 4. Domain Configuration

Update your DNS to point to your server:
- Home server: Point to your home IP
- Cloud: Point to your cloud instance IP

### 5. Monitoring Setup

Enable monitoring:
```bash
docker-compose -f docker-compose.prod.yml --profile monitoring up -d
```

Access monitoring:
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3002 (admin/admin)

## Deployment Commands

### Home Server
```bash
# Deploy
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
# Deploy
./deploy.sh cloud start

# Check status
./deploy.sh cloud status
```

### Manual Commands
```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart services
docker-compose restart
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   sudo netstat -tulpn | grep :3000
   sudo netstat -tulpn | grep :3001
   ```

2. **Container Won't Start**
   ```bash
   docker-compose logs frontend
   docker-compose logs backend
   ```

3. **Build Failures**
   ```bash
   docker-compose down
   docker system prune -f
   docker-compose build --no-cache
   ```

4. **Permission Issues**
   ```bash
   sudo chown -R $USER:$USER .
   chmod +x deploy.sh
   ```

### Health Checks

- Frontend: `http://localhost:3000/health`
- Backend: `http://localhost:3001/health`
- Database: `docker-compose exec database pg_isready`

## Security Considerations

1. **Environment Variables**: Never commit sensitive data
2. **HTTPS**: Use SSL certificates in production
3. **Firewall**: Configure firewall rules
4. **Updates**: Regularly update base images
5. **Backups**: Set up database backups

## Performance Optimization

1. **Caching**: Static assets are cached for 1 year
2. **Compression**: Gzip is enabled
3. **Monitoring**: Prometheus/Grafana for metrics
4. **Scaling**: Can scale services horizontally

## Support

For issues:
1. Check the troubleshooting section in `README-Docker.md`
2. Review container logs
3. Verify environment configuration
4. Test with development setup first

## Files Summary

| File | Purpose |
|------|---------|
| `Dockerfile` | Production React build with nginx |
| `Dockerfile.dev` | Development React build |
| `docker-compose.yml` | Basic production orchestration |
| `docker-compose.dev.yml` | Development environment |
| `docker-compose.prod.yml` | Full production with database |
| `nginx.conf` | Nginx reverse proxy configuration |
| `deploy.sh` | Automated deployment script |
| `env.example` | Environment variables template |
| `init-db.sql` | Database initialization |
| `prometheus.yml` | Monitoring configuration |
| `README-Docker.md` | Comprehensive deployment guide |

Your application is now ready for containerized deployment! 🚀 