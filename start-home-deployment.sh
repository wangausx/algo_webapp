#!/bin/bash

echo "🚀 Starting Algo Trading App on Home Network (192.168.1.143)"
echo "=================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    echo "   Make sure WSL2 integration is enabled in Docker Desktop settings."
    exit 1
fi

echo "✅ Docker is running"

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.home.yml down

# Build and start the application
echo "🔨 Building and starting containers..."
docker-compose -f docker-compose.home.yml up -d --build

# Check container status
echo "📊 Container Status:"
docker-compose -f docker-compose.home.yml ps

echo ""
echo "🎉 Deployment Complete!"
echo "=================================================="
echo "📱 Access your application at:"
echo "   Frontend: http://192.168.1.143:3000"
echo "   Mock API: http://192.168.1.143:3001"
echo ""
echo "🌐 From other devices on your network:"
echo "   http://192.168.1.143:3000"
echo ""
echo "📝 To view logs: docker-compose -f docker-compose.home.yml logs -f"
echo "🛑 To stop: docker-compose -f docker-compose.home.yml down" 