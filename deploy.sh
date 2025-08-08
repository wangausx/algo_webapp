#!/bin/bash

# Deployment script for Algo Trading WebApp
# Updated for native Docker Engine (not Docker Desktop)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker Engine."
        exit 1
    fi
}

# Function to check if docker compose is available
check_docker_compose() {
    if ! docker compose version >/dev/null 2>&1; then
        print_error "Docker Compose is not available. Please install Docker Compose plugin."
        exit 1
    fi
}

# Function to start services
start_services() {
    local environment=$1
    
    print_status "Starting services for environment: $environment"
    
    case $environment in
        "home")
            print_status "Starting home deployment..."
            docker compose -f docker-compose.home.yml up -d --build
            print_status "Services started successfully!"
            print_status "Frontend available at: http://localhost:3000"
            print_status "Backend available at: http://localhost:3001"
            ;;
        "cloud")
            print_status "Starting cloud deployment..."
            docker compose -f docker-compose.prod.yml up -d --build
            print_status "Services started successfully!"
            print_status "Application available at configured domain"
            ;;
        *)
            print_error "Unknown environment: $environment"
            print_error "Available environments: home, cloud"
            exit 1
            ;;
    esac
}

# Function to stop services
stop_services() {
    local environment=$1
    
    print_status "Stopping services for environment: $environment"
    
    case $environment in
        "home")
            docker compose -f docker-compose.home.yml down
            ;;
        "cloud")
            docker compose -f docker-compose.prod.yml down
            ;;
        *)
            print_error "Unknown environment: $environment"
            exit 1
            ;;
    esac
    
    print_status "Services stopped successfully!"
}

# Function to check service status
check_status() {
    local environment=$1
    
    print_status "Checking status for environment: $environment"
    
    case $environment in
        "home")
            docker compose -f docker-compose.home.yml ps
            ;;
        "cloud")
            docker compose -f docker-compose.prod.yml ps
            ;;
        *)
            print_error "Unknown environment: $environment"
            exit 1
            ;;
    esac
}

# Function to view logs
view_logs() {
    local environment=$1
    
    print_status "Viewing logs for environment: $environment"
    
    case $environment in
        "home")
            docker compose -f docker-compose.home.yml logs -f
            ;;
        "cloud")
            docker compose -f docker-compose.prod.yml logs -f
            ;;
        *)
            print_error "Unknown environment: $environment"
            exit 1
            ;;
    esac
}

# Function to restart services
restart_services() {
    local environment=$1
    
    print_status "Restarting services for environment: $environment"
    stop_services $environment
    start_services $environment
}

# Function to clean up resources
cleanup() {
    local environment=$1
    
    print_status "Cleaning up resources for environment: $environment"
    
    case $environment in
        "home")
            docker compose -f docker-compose.home.yml down --volumes --remove-orphans
            ;;
        "cloud")
            docker compose -f docker-compose.prod.yml down --volumes --remove-orphans
            ;;
        *)
            print_error "Unknown environment: $environment"
            exit 1
            ;;
    esac
    
    # Clean up unused Docker resources
    print_status "Cleaning up unused Docker resources..."
    docker system prune -f
    
    print_status "Cleanup completed!"
}

# Function to show help
show_help() {
    echo "Usage: $0 {home|cloud} {start|stop|status|logs|restart|cleanup}"
    echo ""
    echo "Commands:"
    echo "  start     - Start services for the specified environment"
    echo "  stop      - Stop services for the specified environment"
    echo "  status    - Check status of services"
    echo "  logs      - View logs for services"
    echo "  restart   - Restart services"
    echo "  cleanup   - Clean up Docker resources"
    echo ""
    echo "Environments:"
    echo "  home      - Home network deployment (port 3000)"
    echo "  cloud     - Cloud deployment"
    echo ""
    echo "Examples:"
    echo "  $0 home start     - Start home deployment"
    echo "  $0 cloud stop     - Stop cloud deployment"
    echo "  $0 home status    - Check home deployment status"
    echo "  $0 home logs      - View home deployment logs"
}

# Main script logic
main() {
    # Check if Docker is running
    check_docker
    
    # Check if docker compose is available
    check_docker_compose
    
    # Check if correct number of arguments
    if [ $# -lt 2 ]; then
        print_error "Insufficient arguments"
        show_help
        exit 1
    fi
    
    local environment=$1
    local action=$2
    
    case $action in
        "start")
            start_services $environment
            ;;
        "stop")
            stop_services $environment
            ;;
        "status")
            check_status $environment
            ;;
        "logs")
            view_logs $environment
            ;;
        "restart")
            restart_services $environment
            ;;
        "cleanup")
            cleanup $environment
            ;;
        *)
            print_error "Unknown action: $action"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@" 