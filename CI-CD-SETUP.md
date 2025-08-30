# CI/CD Setup for algo_webapp

This document explains the complete CI/CD (Continuous Integration/Continuous Deployment) setup for algo_webapp, which supports both development and production environments, similar to the backend's configuration structure.

## 🏗️ Architecture Overview

```
config/
├── shared/                    # Shared configuration files
│   ├── api.config.js         # Common API configuration
│   ├── build.config.js       # Common build settings
│   └── docker.config.js      # Common Docker configuration
├── development/               # Development environment configs
│   ├── env.development       # Development environment variables
│   ├── docker-compose.development.yml
│   └── README.md
└── production/                # Production environment configs
    ├── env.production        # Production environment variables
    ├── docker-compose.production.yml
    ├── nginx.production.conf
    ├── prometheus.production.yml
    └── README.md
```

## 🌿 Branch Strategy & CI/CD Flow

### **Development Branch** (`development`)
- **Purpose**: Active development, testing, debugging
- **CI/CD**: Automated testing, building, and validation
- **Deployment**: Development environment with mock backend
- **Configuration**: Uses `config/development/`

### **Production Branch** (`production`)
- **Purpose**: Stable, tested code ready for deployment
- **CI/CD**: Full testing, security scanning, production deployment
- **Deployment**: Production environment with backend integration
- **Configuration**: Uses `config/production/`

## 🚀 CI/CD Pipeline Stages

### 1. **Development Pipeline** (Triggered on `development` branch)
```yaml
# .github/workflows/ci-cd.yml
development:
  - Checkout code
  - Setup Node.js
  - Install dependencies
  - Run tests
  - Build development version
  - Build Docker development image
  - Test development environment
  - Upload build artifacts
```

### 2. **Production Pipeline** (Triggered on `production` branch)
```yaml
production:
  - Checkout code
  - Setup Node.js
  - Install dependencies
  - Run tests
  - Build production version
  - Build Docker production image
  - Security scanning (Trivy)
  - Test production environment
  - Upload production artifacts
```

### 3. **Integration Testing** (After production build)
```yaml
integration:
  - Start backend services
  - Deploy frontend with backend integration
  - Run integration tests
  - Verify API connectivity
  - Upload test results
```

### 4. **Security & Quality Checks**
```yaml
security:
  - Security audit (npm audit)
  - Code linting
  - Vulnerability scanning
  - Upload security results
```

### 5. **Production Deployment** (Manual trigger)
```yaml
deploy-production:
  - Deploy to production environment
  - Health checks
  - Notifications
```

## 🔧 Configuration Management

### **Shared Configuration** (`config/shared/`)
- **`api.config.js`**: Common API endpoints, timeouts, retry logic
- **`build.config.js`**: Webpack settings, optimization, code splitting
- **`docker.config.js`**: Base images, ports, volumes, health checks

### **Environment-Specific Configuration**
- **Development**: Hot reloading, source maps, debug tools
- **Production**: Optimized builds, security headers, monitoring

## 📋 Available Commands

### **Unified Deployment Script**
```bash
# Development environment
./deploy.sh dev start          # Start development
./deploy.sh dev stop           # Stop development
./deploy.sh dev status         # Show development status
./deploy.sh dev logs           # Show development logs
./deploy.sh dev restart        # Restart development
./deploy.sh dev health         # Check development health
./deploy.sh dev cleanup        # Clean up development

# Production environment
./deploy.sh prod deploy        # Deploy to production
./deploy.sh prod stop          # Stop production
./deploy.sh prod status        # Show production status
./deploy.sh prod logs          # Show production logs
./deploy.sh prod restart       # Restart production
./deploy.sh prod health        # Check production health
./deploy.sh prod cleanup       # Clean up production
```

### **NPM Scripts**
```bash
# Development
npm run deploy:dev             # Deploy development
npm run deploy:dev:mock        # Deploy with mock backend
npm run deploy:dev:monitoring  # Deploy with monitoring
npm run deploy:dev:status      # Show development status

# Production
npm run deploy:prod            # Deploy to production
npm run deploy:prod:status     # Show production status
npm run deploy:prod:logs       # Show production logs
npm run deploy:prod:health     # Check production health
```

## 🔄 Workflow Examples

### **Development Workflow**
```bash
# 1. Switch to development branch
git checkout development

# 2. Make changes and test locally
npm run start:dev

# 3. Test with Docker development
npm run deploy:dev

# 4. Test with mock backend
npm run deploy:dev:mock

# 5. Test with monitoring
npm run deploy:dev:monitoring

# 6. Commit and push (triggers CI/CD)
git add .
git commit -m "Feature: Add new trading functionality"
git push origin development
```

### **Production Workflow**
```bash
# 1. Switch to production branch
git checkout production

# 2. Merge development changes
git merge development

# 3. Push to trigger CI/CD pipeline
git push origin production

# 4. Monitor CI/CD pipeline in GitHub Actions

# 5. Deploy to production (manual trigger)
npm run deploy:prod

# 6. Verify deployment
npm run deploy:prod:status
npm run deploy:prod:health
```

## 🐳 Docker Environment Management

### **Development Environment**
- **Frontend**: React app with hot reloading
- **Mock Backend**: Nginx serving mock API responses
- **Monitoring**: Optional Prometheus and Grafana
- **Ports**: 3000 (frontend), 3003 (mock backend), 9091 (Prometheus), 3004 (Grafana)

### **Production Environment**
- **Frontend**: Production-optimized React build
- **Backend**: External service integration
- **Nginx**: Reverse proxy with SSL and security
- **Monitoring**: Prometheus and Grafana
- **Ports**: 3000 (frontend), 80/443 (nginx), 9090 (Prometheus), 3003 (Grafana)

## 🔒 Security & Quality Assurance

### **Automated Security Checks**
- **Dependency Scanning**: npm audit for vulnerabilities
- **Container Scanning**: Trivy for Docker image security
- **Code Quality**: ESLint for code standards
- **Security Headers**: Production security headers

### **Quality Gates**
- **Tests Must Pass**: All unit and integration tests
- **Security Scan Clean**: No high-severity vulnerabilities
- **Build Success**: Production build must complete
- **Health Checks**: Services must be healthy

## 📊 Monitoring & Observability

### **Development Monitoring**
- **Real-time Logs**: Docker container logs
- **Health Checks**: Service availability
- **Performance**: Development build metrics

### **Production Monitoring**
- **Prometheus**: Metrics collection
- **Grafana**: Dashboards and visualization
- **Health Endpoints**: Service health monitoring
- **Log Aggregation**: Structured logging

## 🚨 Troubleshooting

### **Common CI/CD Issues**

#### **Build Failures**
```bash
# Check build logs
npm run build:dev
npm run build:docker

# Check Docker build
docker build -f Dockerfile.dev -t algo-trading-frontend:dev .
```

#### **Test Failures**
```bash
# Run tests locally
npm test

# Check test coverage
npm test -- --coverage --watchAll=false
```

#### **Deployment Issues**
```bash
# Check deployment status
./deploy.sh dev status
./deploy.sh prod status

# Check service health
./deploy.sh dev health
./deploy.sh prod health

# View logs
./deploy.sh dev logs
./deploy.sh prod logs
```

### **Environment-Specific Issues**

#### **Development Environment**
```bash
# Check development services
docker compose -f config/development/docker-compose.development.yml ps

# Restart development
./deploy.sh dev restart

# Clean up and restart
./deploy.sh dev cleanup
./deploy.sh dev start
```

#### **Production Environment**
```bash
# Check production services
docker compose -f config/production/docker-compose.production.yml ps

# Restart production
./deploy.sh prod restart

# Check backend integration
curl -f http://localhost:3003/health
```

## 🔧 Configuration Customization

### **Adding New Environments**
1. Create new config directory: `config/staging/`
2. Add environment-specific files
3. Update deployment scripts
4. Add CI/CD pipeline stages

### **Customizing Build Process**
1. Modify `config/shared/build.config.js`
2. Update webpack configuration
3. Add build optimization plugins
4. Configure code splitting strategies

### **Extending Monitoring**
1. Add new Prometheus targets
2. Create custom Grafana dashboards
3. Implement custom health checks
4. Add alerting rules

## 📚 Additional Resources

### **Configuration Files**
- `config/shared/` - Common configuration
- `config/development/` - Development environment
- `config/production/` - Production environment
- `.github/workflows/ci-cd.yml` - CI/CD pipeline

### **Deployment Scripts**
- `deploy.sh` - Unified deployment script
- `deploy-development.sh` - Development deployment
- `deploy-production.sh` - Production deployment

### **Documentation**
- `PRODUCTION-WORKFLOW.md` - Production deployment guide
- `config/production/README.md` - Production configuration
- `config/development/README.md` - Development configuration

## 🎯 Next Steps

1. **Set up GitHub Actions**: Enable the CI/CD workflow
2. **Configure Secrets**: Add necessary environment secrets
3. **Test Pipeline**: Push to development branch to test CI/CD
4. **Deploy to Production**: Use production workflow
5. **Monitor & Optimize**: Track pipeline performance and optimize

---

**Status**: ✅ **CI/CD READY**  
**Next Step**: Enable GitHub Actions and test the pipeline
