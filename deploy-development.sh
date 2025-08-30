#!/bin/bash

# Development Deployment Script for algo_webapp
# This script manages development environment deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="algo_webapp"
CONFIG_DIR="config/development"
FRONTEND_PORT=3000
BACKEND_PORT=3003

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Check if we're on the development branch
check_branch() {
    current_branch=$(git branch --show-current)
    if [ "$current_branch" != "development" ]; then
        warn "You are not on the development branch. Current branch: $current_branch"
        warn "For production deployment, use: ./deploy-production.sh"
    fi
    log "Deploying development environment"
}

# Load development environment
load_environment() {
    log "Loading development environment configuration..."
    
    if [ -f "$CONFIG_DIR/env.development" ]; then
        export $(cat "$CONFIG_DIR/env.development" | grep -v '^#' | xargs)
        log "Development environment loaded"
    else
        warn "Development environment file not found at $CONFIG_DIR/env.development"
    fi
}

# Start development services
start_development() {
    log "Starting development services..."
    
    # Stop existing services
    docker compose -f "$CONFIG_DIR/docker-compose.development.yml" down --remove-orphans 2>/dev/null || true
    
    # Start development services
    docker compose -f "$CONFIG_DIR/docker-compose.development.yml" up -d --build
    
    log "Development services started"
}

# Start with mock backend
start_with_mock() {
    log "Starting development services with mock backend..."
    
    # Stop existing services
    docker compose -f "$CONFIG_DIR/docker-compose.development.yml" down --remove-orphans 2>/dev/null || true
    
    # Start with mock backend profile
    docker compose -f "$CONFIG_DIR/docker-compose.development.yml" --profile mock-backend up -d --build
    
    log "Development services with mock backend started"
}

# Start with monitoring
start_with_monitoring() {
    log "Starting development services with monitoring..."
    
    # Stop existing services
    docker compose -f "$CONFIG_DIR/docker-compose.development.yml" down --remove-orphans 2>/dev/null || true
    
    # Start with monitoring profile
    docker compose -f "$CONFIG_DIR/docker-compose.development.yml" --profile monitoring up -d --build
    
    log "Development services with monitoring started"
}

# Check development health
check_health() {
    log "Checking development environment health..."
    
    # Wait for services to be ready
    sleep 5
    
    # Check frontend health
    if curl -f http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
        log "Frontend is healthy"
    else
        error "Frontend health check failed"
        return 1
    fi
    
    # Check if mock backend is running
    if docker ps | grep -q "mock-backend"; then
        if curl -f http://localhost:$BACKEND_PORT > /dev/null 2>&1; then
            log "Mock backend is healthy"
        else
            warn "Mock backend health check failed"
        fi
    fi
    
    log "Development environment health check completed"
}

# Show development status
show_status() {
    log "Development Environment Status:"
    echo "================================"
    
    # Frontend status
    if docker ps | grep -q "algo_webapp_frontend"; then
        echo -e "Frontend: ${GREEN}Running${NC}"
    else
        echo -e "Frontend: ${RED}Not Running${NC}"
    fi
    
    # Mock backend status
    if docker ps | grep -q "mock-backend"; then
        echo -e "Mock Backend: ${GREEN}Running${NC}"
    else
        echo -e "Mock Backend: ${YELLOW}Not Running${NC}"
    fi
    
    # Monitoring status
    if docker ps | grep -q "prometheus-dev"; then
        echo -e "Prometheus: ${GREEN}Running${NC}"
    else
        echo -e "Prometheus: ${YELLOW}Not Running${NC}"
    fi
    
    if docker ps | grep -q "grafana-dev"; then
        echo -e "Grafana: ${GREEN}Running${NC}"
    else
        echo -e "Grafana: ${YELLOW}Not Running${NC}"
    fi
    
    # Port status
    if netstat -tulpn 2>/dev/null | grep -q ":$FRONTEND_PORT "; then
        echo -e "Frontend Port $FRONTEND_PORT: ${GREEN}Listening${NC}"
    else
        echo -e "Frontend Port $FRONTEND_PORT: ${RED}Not Listening${NC}"
    fi
    
    echo ""
    echo "Access URLs:"
    echo "Frontend: http://localhost:$FRONTEND_PORT"
    echo "Mock Backend: http://localhost:$BACKEND_PORT"
    echo "Prometheus: http://localhost:9091"
    echo "Grafana: http://localhost:3004"
}

# Show logs
show_logs() {
    log "Showing development logs..."
    docker compose -f "$CONFIG_DIR/docker-compose.development.yml" logs -f
}

# Stop development services
stop_services() {
    log "Stopping development services..."
    docker compose -f "$CONFIG_DIR/docker-compose.development.yml" down
    log "Development services stopped"
}

# Clean up resources
cleanup() {
    log "Cleaning up development resources..."
    
    # Stop and remove containers
    docker compose -f "$CONFIG_DIR/docker-compose.development.yml" down --volumes --remove-orphans
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused networks
    docker network prune -f
    
    log "Cleanup completed"
}

# Main development deployment function
deploy() {
    log "Starting development deployment..."
    
    check_branch
    load_environment
    start_development
    check_health
    show_status
    
    log "Development deployment completed successfully!"
}

# Main script logic
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "mock")
        check_branch
        load_environment
        start_with_mock
        check_health
        show_status
        ;;
    "monitoring")
        check_branch
        load_environment
        start_with_monitoring
        check_health
        show_status
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs
        ;;
    "stop")
        stop_services
        ;;
    "cleanup")
        cleanup
        ;;
    "restart")
        stop_services
        sleep 2
        deploy
        ;;
    "health")
        check_health
        ;;
    *)
        echo "Usage: $0 {deploy|mock|monitoring|status|logs|stop|cleanup|restart|health}"
        echo ""
        echo "Commands:"
        echo "  deploy      - Deploy development environment (default)"
        echo "  mock        - Deploy with mock backend"
        echo "  monitoring  - Deploy with monitoring stack"
        echo "  status      - Show development status"
        echo "  logs        - Show development logs"
        echo "  stop        - Stop development services"
        echo "  cleanup     - Clean up all resources"
        echo "  restart     - Restart development services"
        echo "  health      - Check development health"
        exit 1
        ;;
esac
