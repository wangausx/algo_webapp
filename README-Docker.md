# Docker Deployment Guide for Algo Trading WebApp

This guide explains how to containerize and deploy the Algo Trading WebApp using Docker.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Git

## Project Structure

```
algo_webapp/
├── Dockerfile              # Production build
├── Dockerfile.dev          # Development build
├── docker-compose.yml      # Production orchestration
├── docker-compose.dev.yml  # Development orchestration
├── nginx.conf             # Nginx configuration
├── .dockerignore          # Docker ignore file
├── deploy.sh              # Deployment script
└── src/                   # React application source
```

## Quick Start

### 1. Development Environment

For local development with hot reloading:

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up --build

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

### 2. Production Environment

For production deployment:

```bash
# Build and start production services
./deploy.sh home start

# Or manually
docker-compose up -d --build
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Backend Configuration
NODE_ENV=production
PORT=3001
DATABASE_URL=your_database_url_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Frontend Configuration
REACT_APP_API_URL=http://localhost:3000
```

### Backend Service

**Important**: You need to provide your own backend service. Update the `docker-compose.yml` file:

```yaml
backend:
  image: your-backend-image:latest  # Replace with your backend image
  # OR build from source:
  # build:
  #   context: ../backend
  #   dockerfile: Dockerfile
```

## Deployment Options

### 1. Home Server Deployment

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

### 2. Cloud Deployment

```bash
# Deploy to cloud environment
./deploy.sh cloud start

# Check status
./deploy.sh cloud status
```

### 3. Manual Docker Commands

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart services
docker-compose restart
```

## Architecture

### Production Setup

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx (80)    │───▶│  React App      │    │   Backend       │
│   (Frontend)    │    │   (Static)      │    │   (3001)        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Development Setup

```
┌─────────────────┐    ┌─────────────────┐
│  React Dev      │    │   Backend Dev   │
│  Server (3000)  │    │   Server (3001) │
└─────────────────┘    └─────────────────┘
```

## Nginx Configuration

The `nginx.conf` file includes:

- **API Proxying**: Routes `/api/*` requests to backend
- **WebSocket Support**: Routes WebSocket connections to backend
- **Router Endpoints**: Routes `/router/*` requests to backend
- **Static File Serving**: Serves React build files
- **Security Headers**: Adds security headers
- **Gzip Compression**: Enables compression for better performance
- **Health Check**: Provides `/health` endpoint

## Health Checks

The application includes health checks for both frontend and backend:

- **Frontend**: `http://localhost:3000/health`
- **Backend**: `http://localhost:3001/health`

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check what's using the ports
   sudo netstat -tulpn | grep :3000
   sudo netstat -tulpn | grep :3001
   ```

2. **Container Won't Start**
   ```bash
   # Check container logs
   docker-compose logs frontend
   docker-compose logs backend
   ```

3. **Build Failures**
   ```bash
   # Clean and rebuild
   docker-compose down
   docker system prune -f
   docker-compose build --no-cache
   ```

4. **Permission Issues**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   chmod +x deploy.sh
   ```

### Debugging

```bash
# Enter running container
docker-compose exec frontend sh
docker-compose exec backend sh

# View real-time logs
docker-compose logs -f --tail=100

# Check resource usage
docker stats
```

## Production Considerations

### Security

1. **Environment Variables**: Never commit sensitive data
2. **HTTPS**: Use reverse proxy (Nginx/Traefik) with SSL
3. **Firewall**: Configure firewall rules
4. **Updates**: Regularly update base images

### Performance

1. **Caching**: Enable browser caching for static assets
2. **Compression**: Gzip is enabled in nginx.conf
3. **Monitoring**: Add monitoring tools (Prometheus, Grafana)
4. **Load Balancing**: Use multiple instances for high availability

### Scaling

```bash
# Scale frontend instances
docker-compose up -d --scale frontend=3

# Scale backend instances
docker-compose up -d --scale backend=2
```

## Cloud Deployment

### AWS ECS

1. Create ECR repositories
2. Push images to ECR
3. Create ECS cluster and services
4. Configure Application Load Balancer

### Google Cloud Run

1. Build and push to Container Registry
2. Deploy using Cloud Run
3. Configure domain and SSL

### Azure Container Instances

1. Build and push to Azure Container Registry
2. Deploy using Azure Container Instances
3. Configure custom domain

## Monitoring and Logging

### Log Aggregation

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f frontend
docker-compose logs -f backend
```

### Health Monitoring

```bash
# Check service health
docker-compose ps

# Monitor resource usage
docker stats
```

## Backup and Recovery

### Database Backups

```bash
# Backup database (if using PostgreSQL)
docker-compose exec database pg_dump -U trading_user trading_db > backup.sql

# Restore database
docker-compose exec -T database psql -U trading_user trading_db < backup.sql
```

### Volume Backups

```bash
# Backup volumes
docker run --rm -v trading-network_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .

# Restore volumes
docker run --rm -v trading-network_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_backup.tar.gz -C /data
```

## Maintenance

### Regular Maintenance

```bash
# Update images
docker-compose pull

# Clean up unused resources
./deploy.sh home cleanup

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

For issues and questions:

1. Check the troubleshooting section
2. Review container logs
3. Verify environment configuration
4. Test with development setup first 