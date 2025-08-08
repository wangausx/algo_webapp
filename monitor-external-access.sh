#!/bin/bash

echo "🔍 External Access Monitor"
echo "========================="

# Get public IP
PUBLIC_IP=$(curl -s https://ipinfo.io/ip)
echo "📍 Public IP: $PUBLIC_IP"
echo "🏠 Local IP: 192.168.1.143"
echo ""

# Test local access
echo "🧪 Testing Local Access:"
LOCAL_HEALTH=$(curl -s http://192.168.1.143:3000/health)
if [ "$LOCAL_HEALTH" = "healthy" ]; then
    echo "✅ Local frontend: Working"
else
    echo "❌ Local frontend: Not responding"
fi

LOCAL_API=$(curl -s http://192.168.1.143:3001 | head -c 50)
if [ -n "$LOCAL_API" ]; then
    echo "✅ Local API: Working"
else
    echo "❌ Local API: Not responding"
fi

echo ""

# Test external access (if port forwarding is set up)
echo "🌐 Testing External Access:"
EXTERNAL_HEALTH=$(curl -s --connect-timeout 5 http://$PUBLIC_IP:3000/health 2>/dev/null)
if [ "$EXTERNAL_HEALTH" = "healthy" ]; then
    echo "✅ External frontend: Working"
    echo "🔗 Access URL: http://$PUBLIC_IP:3000"
else
    echo "❌ External frontend: Not accessible"
    echo "💡 This is normal if port forwarding is not set up yet"
fi

EXTERNAL_API=$(curl -s --connect-timeout 5 http://$PUBLIC_IP:3001 2>/dev/null | head -c 50)
if [ -n "$EXTERNAL_API" ]; then
    echo "✅ External API: Working"
    echo "🔗 API URL: http://$PUBLIC_IP:3001"
else
    echo "❌ External API: Not accessible"
    echo "💡 This is normal if port forwarding is not set up yet"
fi

echo ""

# Show recent access logs
echo "📊 Recent Access Logs:"
echo "======================"
docker-compose -f docker-compose.home.yml logs --tail=5 frontend | grep -E "(GET|POST)" || echo "No recent access logs found"

echo ""

# Show container status
echo "📦 Container Status:"
echo "==================="
docker-compose -f docker-compose.home.yml ps

echo ""

# Security check
echo "🔒 Security Status:"
echo "=================="
echo "⚠️  Current setup: HTTP only (no SSL)"
echo "⚠️  No authentication configured"
echo "💡 Consider adding HTTPS and authentication for production use"

echo ""

echo "📋 Next Steps:"
echo "=============="
if [ "$EXTERNAL_HEALTH" != "healthy" ]; then
    echo "1. Set up port forwarding in your router"
    echo "2. Test external access again"
    echo "3. Consider adding SSL/HTTPS"
else
    echo "1. ✅ External access is working!"
    echo "2. Consider adding SSL/HTTPS"
    echo "3. Set up authentication"
    echo "4. Monitor access logs regularly"
fi

echo ""
echo "📚 For detailed setup instructions: ./setup-external-access.sh" 