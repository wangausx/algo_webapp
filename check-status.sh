#!/bin/bash

echo "🔍 Algo Trading App Status Check"
echo "================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running"
    exit 1
fi

echo "✅ Docker is running"

# Check container status
echo ""
echo "📊 Container Status:"
docker-compose -f docker-compose.home.yml ps

echo ""
echo "🌐 Network Connectivity Test:"
echo "Testing from your home network (192.168.1.143)..."

# Test frontend
if curl -s -o /dev/null -w "%{http_code}" http://192.168.1.143:3000/health | grep -q "200"; then
    echo "✅ Frontend: http://192.168.1.143:3000 - Healthy"
else
    echo "❌ Frontend: http://192.168.1.143:3000 - Not responding"
fi

# Test mock API
if curl -s -o /dev/null -w "%{http_code}" http://192.168.1.143:3001 | grep -q "200"; then
    echo "✅ Mock API: http://192.168.1.143:3001 - Healthy"
else
    echo "❌ Mock API: http://192.168.1.143:3001 - Not responding"
fi

echo ""
echo "📝 Recent container logs:"
echo "========================"
docker-compose -f docker-compose.home.yml logs --tail=10

echo ""
echo "🔗 Access URLs:"
echo "  Frontend: http://192.168.1.143:3000"
echo "  API: http://192.168.1.143:3001" 