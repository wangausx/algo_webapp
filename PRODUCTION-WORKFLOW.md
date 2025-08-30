# Production Workflow for algo_webapp

This document outlines the complete workflow for deploying algo_webapp to production, integrating with the backend production setup.

## 🌿 Branch Strategy

### **Development Branch** (`development`)
- **Purpose**: Active development, testing, debugging
- **Configuration**: Uses development Docker setup
- **Database**: SQLite for local development
- **Features**: Hot reloading, development tools, debug logging

### **Production Branch** (`production`)
- **Purpose**: Stable, tested code ready for deployment
- **Configuration**: Uses `config/production/`
- **Integration**: Works with backend production services
- **Features**: Optimized builds, monitoring, health checks

## 🚀 Complete Deployment Workflow

### Phase 1: Development
```bash
# 1. Work on development branch
git checkout development

# 2. Make changes and test locally
npm run start:dev

# 3. Test with Docker development
npm run docker:dev

# 4. Commit and push changes
git add .
git commit -m "Feature: Add new trading functionality"
git push origin development
```

### Phase 2: Testing & Integration
```bash
# 1. Test with backend integration
cd ../backend
docker compose -f docker-compose.full-stack.yml up -d

# 2. Test frontend-backend communication
# Access at http://localhost:8082

# 3. Verify all features work correctly
# Test API calls, WebSocket connections, etc.
```

### Phase 3: Production Deployment
```bash
# 1. Switch to production branch
git checkout production

# 2. Merge development changes
git merge development

# 3. Deploy to production
npm run deploy:production

# 4. Verify deployment
npm run deploy:production:status
npm run deploy:production:health
```

## 🔧 Configuration Management

### Environment-Specific Configs

#### Development Environment
```bash
# .env.development
NODE_ENV=development
REACT_APP_DOCKER=false
REACT_APP_API_URL=http://localhost:3001
```

#### Production Environment
```bash
# config/production/env.production
NODE_ENV=production
REACT_APP_DOCKER=true
REACT_APP_API_URL_AUTO=true
REACT_APP_API_URL_LOCALHOST=http://localhost:3003
REACT_APP_API_URL_HOME=http://192.168.1.143:3003
REACT_APP_API_URL_EXTERNAL=http://107.137.66.174:3003
REACT_APP_API_URL_DDNS=http://autotrade.mywire.org:3003
```

### Docker Compose Files

#### Development
- `docker-compose.dev.yml` - Local development
- `docker-compose.dev.home.yml` - Home network development
- `docker-compose.yml` - Default development

#### Production
- `config/production/docker-compose.production.yml` - Production with backend integration

## 🔗 Backend Integration Points

### Service Dependencies
```yaml
# Frontend depends on these backend services
backend:
  external: true
  networks:
    - backend_trading-network

database:
  external: true
  networks:
    - backend_trading-network

redis:
  external: true
  networks:
    - backend_trading-network
```

### Network Configuration
```yaml
networks:
  trading-network:
    external: true
    name: backend_trading-network
```

### API Routing
```nginx
# Nginx routes API calls to backend
location /api/ {
    proxy_pass http://backend_api/;
}

location /ws/ {
    proxy_pass http://backend_api/ws/;
}
```

## 📊 Monitoring & Health Checks

### Health Endpoints
- **Frontend**: `http://localhost:3000/health`
- **Backend**: `http://localhost:3003/health`
- **Database**: PostgreSQL connection check
- **Redis**: Connection and health check

### Monitoring Stack
- **Prometheus**: Metrics collection
- **Grafana**: Dashboard and visualization
- **Nginx**: Access and error logs
- **Docker**: Container health and resource usage

## 🛡️ Security Implementation

### Production Security Features
- **Rate Limiting**: API endpoints protected
- **Security Headers**: XSS protection, frame options
- **SSL/TLS**: HTTPS with modern ciphers
- **CORS**: Restricted domain access
- **Input Validation**: Sanitized user inputs

### Environment Security
- **No Source Maps**: Prevents code exposure
- **No Debug Info**: Production-optimized builds
- **Secure Headers**: Security-focused HTTP headers
- **Container Isolation**: Docker security best practices

## 🔄 Deployment Commands

### Development Commands
```bash
# Start development
npm run start:dev

# Docker development
npm run docker:dev

# Home network development
npm run docker:dev:home
```

### Production Commands
```bash
# Deploy to production
npm run deploy:production

# Check status
npm run deploy:production:status

# View logs
npm run deploy:production:logs

# Stop services
npm run deploy:production:stop

# Restart services
npm run deploy:production:restart

# Health check
npm run deploy:production:health
```

### Manual Commands
```bash
# Direct script execution
./deploy-production.sh deploy
./deploy-production.sh status
./deploy-production.sh logs
```

## 🐛 Troubleshooting Guide

### Common Issues & Solutions

#### 1. Backend Not Running
```bash
# Check backend status
docker ps | grep backend

# Start backend production services
cd ../backend
./scripts/deploy.sh prod start
```

#### 2. Network Connectivity Issues
```bash
# Check Docker networks
docker network ls

# Inspect network configuration
docker network inspect backend_trading-network

# Verify backend services are accessible
docker exec -it algo_webapp_frontend ping backend
```

#### 3. Port Conflicts
```bash
# Check port usage
netstat -tulpn | grep :3000

# Kill conflicting processes
sudo fuser -k 3000/tcp
```

#### 4. Build Failures
```bash
# Clean build directory
rm -rf build/

# Clear Docker cache
docker system prune -f

# Rebuild with production settings
npm run build:docker
```

### Debug Commands
```bash
# Check container logs
docker compose -f config/production/docker-compose.production.yml logs -f

# Inspect container configuration
docker inspect algo_webapp_frontend

# Check environment variables
docker exec -it algo_webapp_frontend env

# Test API connectivity
curl -v http://localhost:3000/health
```

## 📈 Performance Optimization

### Build Optimizations
- **Code Splitting**: Dynamic imports for better loading
- **Tree Shaking**: Remove unused code
- **Minification**: Compressed JavaScript and CSS
- **Asset Optimization**: Optimized images and fonts

### Runtime Optimizations
- **Lazy Loading**: Components loaded on demand
- **Memoization**: React performance optimizations
- **Bundle Analysis**: Monitor bundle size and performance

## 🔍 Testing Strategy

### Pre-Deployment Testing
1. **Unit Tests**: `npm test`
2. **Integration Tests**: API connectivity tests
3. **E2E Tests**: Full user workflow testing
4. **Performance Tests**: Load and stress testing

### Production Testing
1. **Health Checks**: Automated health monitoring
2. **Performance Monitoring**: Real-time performance metrics
3. **Error Tracking**: Production error logging
4. **User Feedback**: Production user experience monitoring

## 📚 Documentation & Resources

### Configuration Files
- `config/production/README.md` - Production configuration guide
- `config/production/index.js` - Configuration index
- `DEPLOYMENT.md` - General deployment guide
- `DOCKER-SETUP.md` - Docker configuration guide

### Backend Integration
- `../backend/PRODUCTION-SETUP.md` - Backend production guide
- `../backend/docker-compose.full-stack.yml` - Full-stack configuration

### Monitoring & Security
- `SECURITY_IMPLEMENTATION_PLAN.md` - Security implementation
- `config/production/prometheus.production.yml` - Monitoring configuration

## 🆘 Support & Maintenance

### Regular Maintenance Tasks
1. **Daily**: Check service health and logs
2. **Weekly**: Review performance metrics
3. **Monthly**: Security updates and patches
4. **Quarterly**: Performance optimization review

### Emergency Procedures
1. **Service Down**: Check logs and restart services
2. **Performance Issues**: Scale resources or optimize code
3. **Security Breach**: Immediate isolation and investigation
4. **Data Loss**: Restore from backups

### Contact Information
- **Development Team**: Internal development team
- **DevOps Team**: Infrastructure and deployment support
- **Security Team**: Security incidents and vulnerabilities

---

## 🎯 Next Steps

1. **Complete Backend Setup**: Ensure backend production services are running
2. **Test Integration**: Verify frontend-backend communication
3. **Deploy to Production**: Use the production deployment workflow
4. **Monitor Performance**: Set up monitoring and alerting
5. **Document Issues**: Record any problems and solutions

**Remember**: Always test thoroughly in development before deploying to production!
