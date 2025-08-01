#!/bin/bash

# Deployment script for Algo Trading WebApp
# Usage: ./deploy.sh [home|cloud] [start|stop|restart|build]

set -e

ENVIRONMENT=${1:-home}
ACTION=${2:-start}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="algo-trading-app"
COMPOSE_FILE="docker-compose.yml"

# Environment-specific configurations
if [ "$ENVIRONMENT" = "home" ]; then
    echo -e "${GREEN}Deploying to HOME SERVER${NC}"
    export COMPOSE_PROJECT_NAME="${PROJECT_NAME}-home"
    # Add any home-specific environment variables here
elif [ "$ENVIRONMENT" = "cloud" ]; then
    echo -e "${GREEN}Deploying to CLOUD${NC}"
    export COMPOSE_PROJECT_NAME="${PROJECT_NAME}-cloud"
    # Add any cloud-specific environment variables here
else
    echo -e "${RED}Invalid environment. Use 'home' or 'cloud'${NC}"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}docker-compose is not installed. Please install it first.${NC}"
    exit 1
fi

# Functions
build_images() {
    echo -e "${YELLOW}Building Docker images...${NC}"
    docker-compose -f $COMPOSE_FILE build --no-cache
    echo -e "${GREEN}Images built successfully!${NC}"
}

start_services() {
    echo -e "${YELLOW}Starting services...${NC}"
    docker-compose -f $COMPOSE_FILE up -d
    echo -e "${GREEN}Services started successfully!${NC}"
    
    # Wait for services to be healthy
    echo -e "${YELLOW}Waiting for services to be healthy...${NC}"
    sleep 10
    
    # Check service health
    if docker-compose -f $COMPOSE_FILE ps | grep -q "unhealthy"; then
        echo -e "${RED}Some services are unhealthy. Check logs with: docker-compose logs${NC}"
        exit 1
    else
        echo -e "${GREEN}All services are healthy!${NC}"
    fi
}

stop_services() {
    echo -e "${YELLOW}Stopping services...${NC}"
    docker-compose -f $COMPOSE_FILE down
    echo -e "${GREEN}Services stopped successfully!${NC}"
}

restart_services() {
    echo -e "${YELLOW}Restarting services...${NC}"
    docker-compose -f $COMPOSE_FILE restart
    echo -e "${GREEN}Services restarted successfully!${NC}"
}

show_logs() {
    echo -e "${YELLOW}Showing logs...${NC}"
    docker-compose -f $COMPOSE_FILE logs -f
}

show_status() {
    echo -e "${YELLOW}Service status:${NC}"
    docker-compose -f $COMPOSE_FILE ps
}

cleanup() {
    echo -e "${YELLOW}Cleaning up unused Docker resources...${NC}"
    docker system prune -f
    echo -e "${GREEN}Cleanup completed!${NC}"
}

# Main execution
case $ACTION in
    "build")
        build_images
        ;;
    "start")
        build_images
        start_services
        show_status
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        restart_services
        show_status
        ;;
    "logs")
        show_logs
        ;;
    "status")
        show_status
        ;;
    "cleanup")
        cleanup
        ;;
    *)
        echo -e "${RED}Invalid action. Use: start, stop, restart, build, logs, status, or cleanup${NC}"
        echo -e "${YELLOW}Usage: $0 [home|cloud] [start|stop|restart|build|logs|status|cleanup]${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}Deployment script completed successfully!${NC}" 