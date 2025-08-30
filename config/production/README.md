# Production Configuration for algo_webapp

This directory contains all production configuration files for the algo_webapp, designed to work with the backend production setup.

## 📁 File Structure

```
config/production/
├── README.md                           # This file
├── index.js                           # Production configuration index
├── env.production                     # Production environment variables
├── docker-compose.production.yml      # Production Docker Compose
├── nginx.production.conf              # Production Nginx configuration
└── prometheus.production.yml          # Production monitoring configuration
```

## 🚀 Quick Start

### 1. Switch to Production Branch
```bash
git checkout production
```

### 2. Deploy to Production
```bash
# Deploy frontend with backend integration
npm run deploy:production

# Check deployment status
npm run deploy:production:status

# View logs
npm run deploy:production:logs
```

## 🔧 Configuration Details

### Environment Variables (`env.production`)
- **NODE_ENV**: Set to `production`
- **REACT_APP_DOCKER**: Set to `true` for Docker deployment
- **API URLs**: Configured for different access patterns (localhost, home network, external)

### Docker Compose (`docker-compose.production.yml`)
- **Frontend**: React app with production build
- **Backend**: External service (provided by backend production setup)
- **Database**: External service (provided by backend production setup)
- **Redis**: External service (provided by backend production setup)
- **Nginx**: Reverse proxy with SSL support
- **Monitoring**: Prometheus and Grafana

### Nginx Configuration (`nginx.production.conf`)
- **API Proxy**: Routes `/api/*` to backend
- **WebSocket Proxy**: Routes `/ws/*` to backend
- **Static Files**: Serves React build files
- **Security**: Rate limiting, security headers
- **SSL**: HTTPS support with proper configuration

### Monitoring (`prometheus.production.yml`)
- **Frontend Metrics**: Health checks and performance
- **Backend Metrics**: API performance and health
- **System Metrics**: Docker and system resources
- **Custom Metrics**: Trading prediction service

## 🔗 Backend Integration

The production setup is designed to work with the backend production configuration:

### Network Integration
- Uses external network `backend_trading-network`
- Backend services are expected to be running
- Frontend connects to backend via internal Docker network

### Service Dependencies
- **Backend API**: Must be running on port 3001
- **Database**: PostgreSQL must be accessible
- **Redis**: Must be running for caching
- **Trading Predict**: Must be running on port 5555

## 📊 Monitoring & Health Checks

### Health Endpoints
- **Frontend**: `http://localhost:3000/health`
- **Backend**: `http://localhost:3003/health` (if available)

### Monitoring URLs
- **Prometheus**: `http://localhost:9090`
- **Grafana**: `http://localhost:3003`

## 🛡️ Security Features

### Production Security
- **Rate Limiting**: API endpoints are rate-limited
- **Security Headers**: XSS protection, frame options
- **CORS**: Restricted to specific domains
- **SSL**: HTTPS support with modern ciphers

### Environment Security
- **No Source Maps**: Prevents code exposure
- **No Debug Info**: Production-optimized builds
- **Secure Headers**: Security-focused HTTP headers

## 🔄 Deployment Workflow

### Development to Production
1. **Development**: Work on `development` branch
2. **Testing**: Test locally with Docker
3. **Production**: Merge to `production` branch
4. **Deploy**: Run production deployment script

### Production Commands
```bash
# Deploy
./deploy-production.sh deploy

# Check status
./deploy-production.sh status

# View logs
./deploy-production.sh logs

# Stop services
./deploy-production.sh stop

# Restart services
./deploy-production.sh restart

# Health check
./deploy-production.sh health

# Cleanup
./deploy-production.sh cleanup
```

## 🐛 Troubleshooting

### Common Issues

#### Backend Not Running
```bash
# Check if backend is running
docker ps | grep backend

# Start backend production services
cd ../backend
./scripts/deploy.sh prod start
```

#### Port Conflicts
```bash
# Check port usage
netstat -tulpn | grep :3000

# Kill conflicting processes
sudo fuser -k 3000/tcp
```

#### Network Issues
```bash
# Check Docker networks
docker network ls

# Inspect network configuration
docker network inspect backend_trading-network
```

### Log Locations
- **Frontend**: Docker container logs
- **Nginx**: `/var/log/nginx/` (inside container)
- **Backend**: Backend container logs

## 📚 Additional Resources

- [Backend Production Setup](../backend/PRODUCTION-SETUP.md)
- [Docker Setup Guide](../../DOCKER-SETUP.md)
- [Deployment Guide](../../DEPLOYMENT.md)
- [Security Implementation](../../SECURITY_IMPLEMENTATION_PLAN.md)

## 🆘 Support

For production issues:
1. Check the troubleshooting section
2. Review logs using `./deploy-production.sh logs`
3. Check service status with `./deploy-production.sh status`
4. Verify backend integration
5. Consult the development team

---

**Remember**: Always test in development before deploying to production!
