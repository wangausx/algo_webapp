#!/bin/bash

# Script to restart development deployment with external access
echo "Stopping current development deployment..."
docker compose -f docker-compose.dev.home.yml down

echo "Removing any existing containers..."
docker compose -f docker-compose.dev.home.yml rm -f

echo "Starting development deployment with external access..."
docker compose -f docker-compose.dev.home.yml up -d --build

echo "Waiting for services to start..."
sleep 10

echo "Checking container status..."
docker compose -f docker-compose.dev.home.yml ps

echo "Checking container logs..."
docker compose -f docker-compose.dev.home.yml logs frontend

echo ""
echo "Development deployment should now be accessible at:"
echo "- Local: http://localhost:8082"
echo "- Internal Network: http://192.168.1.143:8082"
echo "- External: http://107.137.66.174:8082"
echo ""
echo "If external access still doesn't work, check:"
echo "1. Firewall settings on 107.137.66.174"
echo "2. Router port forwarding for port 8082"
echo "3. Container logs above for any errors"
