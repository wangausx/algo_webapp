#!/bin/bash

# Script to test external access to the development server
echo "=== Testing External Access to Development Server ==="
echo ""

# Test 1: Check if the container is running and accessible locally
echo "1. Testing local access..."
if curl -s http://localhost:8082 > /dev/null; then
    echo "   ✓ Local access (localhost:8082) - SUCCESS"
else
    echo "   ✗ Local access (localhost:8082) - FAILED"
fi

# Test 2: Check if the container is accessible from internal network
echo "2. Testing internal network access..."
if curl -s http://192.168.1.143:8082 > /dev/null; then
    echo "   ✓ Internal network access (192.168.1.143:8082) - SUCCESS"
else
    echo "   ✗ Internal network access (192.168.1.143:8082) - FAILED"
fi

# Test 3: Check if the external IP is accessible from the machine itself
echo "3. Testing external IP access from local machine..."
if curl -s http://107.137.66.174:8082 > /dev/null; then
    echo "   ✓ External IP access from local machine (107.137.66.174:8082) - SUCCESS"
else
    echo "   ✗ External IP access from local machine (107.137.66.174:8082) - FAILED"
fi

# Test 4: Check container logs for any errors
echo ""
echo "4. Checking container logs for errors..."
docker compose -f docker-compose.dev.home.yml logs frontend --tail=20

# Test 5: Check if port 8082 is actually listening on all interfaces
echo ""
echo "5. Checking if port 8082 is listening on all interfaces..."
if netstat -tlnp 2>/dev/null | grep :8082; then
    echo "   ✓ Port 8082 is listening"
else
    echo "   ✗ Port 8082 is not listening or not accessible"
fi

# Test 6: Check Docker container port mapping
echo ""
echo "6. Checking Docker container port mapping..."
docker compose -f docker-compose.dev.home.yml ps

echo ""
echo "=== Summary ==="
echo "If local and internal access work but external doesn't:"
echo "  - Check firewall settings on 107.137.66.174"
echo "  - Check router port forwarding for port 8082"
echo "  - Check if your ISP is blocking external access"
echo ""
echo "If all tests fail:"
echo "  - Check container logs above"
echo "  - Restart the development deployment"
