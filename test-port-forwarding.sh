#!/bin/bash

# Script to test if port forwarding is actually working
echo "=== Testing Port Forwarding for Port 8082 ==="
echo ""

# Test 1: Check if we can reach the external IP
echo "1. Testing external IP reachability..."
if ping -c 1 107.137.66.174 > /dev/null 2>&1; then
    echo "   ✓ External IP (107.137.66.174) is reachable"
else
    echo "   ✗ External IP (107.137.66.174) is not reachable"
    echo "   This suggests a network connectivity issue"
    exit 1
fi

# Test 2: Check if port 8082 is open from external perspective
echo ""
echo "2. Testing external port 8082 accessibility..."
echo "   This will test if port 8082 is actually accessible from outside your network"
echo "   If this hangs, the port is blocked by firewall"

# Use telnet to test port connectivity (more reliable than curl for this)
timeout 10 bash -c "</dev/tcp/107.137.66.174/8082" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "   ✓ Port 8082 is accessible from external network"
else
    echo "   ✗ Port 8082 is NOT accessible from external network"
    echo "   This confirms a firewall/port forwarding issue"
fi

# Test 3: Check what ports are actually open
echo ""
echo "3. Checking what ports are open on external IP..."
echo "   Common ports to check: 80, 443, 22, 8080, 3000"
for port in 80 443 22 8080 3000; do
    timeout 3 bash -c "</dev/tcp/107.137.66.174/$port" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "   ✓ Port $port is open"
    else
        echo "   ✗ Port $port is closed"
    fi
done

echo ""
echo "=== Diagnosis ==="
echo "If port 8082 is not accessible but other ports are:"
echo "  - Port forwarding for 8082 is not working"
echo "  - Firewall is blocking port 8082 specifically"
echo ""
echo "If no ports are accessible:"
echo "  - Router firewall is blocking all external access"
echo "  - ISP might be blocking residential server hosting"
echo ""
echo "Next steps:"
echo "1. Check router firewall rules for port 8082"
echo "2. Verify port forwarding rule: External 8082 → Internal 192.168.1.143:8082"
echo "3. Check if your ISP blocks residential server hosting"
