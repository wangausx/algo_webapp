#!/bin/bash

# Start Docker service if not running
if ! sudo systemctl is-active --quiet docker; then
    echo "Starting Docker service..."
    sudo systemctl start docker
fi

# Wait for Docker to be ready
echo "Waiting for Docker to be ready..."
timeout=30
counter=0
while ! docker info >/dev/null 2>&1 && [ $counter -lt $timeout ]; do
    sleep 1
    counter=$((counter + 1))
done

if docker info >/dev/null 2>&1; then
    echo "Docker is ready!"
else
    echo "Docker failed to start within $timeout seconds"
    exit 1
fi 