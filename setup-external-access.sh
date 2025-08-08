#!/bin/bash

echo "🌐 External Access Setup for Algo Trading App"
echo "============================================="

# Get public IP
PUBLIC_IP=$(curl -s https://ipinfo.io/ip)
echo "📍 Your Public IP: $PUBLIC_IP"
echo "🏠 Your Local IP: 192.168.1.143"
echo ""

echo "📋 Router Configuration Required:"
echo "================================"
echo "1. Open your browser and go to: http://192.168.1.254"
echo "2. Login to your AT&T router"
echo "3. Find 'Port Forwarding' or 'Virtual Server' settings"
echo "4. Add these rules:"
echo ""
echo "┌─────────────┬─────────────────┬─────────────┬──────────┬─────────────────┐"
echo "│ External    │ Internal IP     │ Internal    │ Protocol │ Description     │"
echo "│ Port        │                 │ Port        │          │                 │"
echo "├─────────────┼─────────────────┼─────────────┼──────────┼─────────────────┤"
echo "│ 3000        │ 192.168.1.143   │ 3000        │ TCP      │ Frontend App    │"
echo "│ 3001        │ 192.168.1.143   │ 3001        │ TCP      │ API Backend     │"
echo "└─────────────┴─────────────────┴─────────────┴──────────┴─────────────────┘"
echo ""

echo "🔗 After Port Forwarding Setup:"
echo "==============================="
echo "Your app will be accessible at:"
echo "  Frontend: http://$PUBLIC_IP:3000"
echo "  API: http://$PUBLIC_IP:3001"
echo ""

echo "🧪 Test Commands:"
echo "================="
echo "# Test from external network (mobile data, etc.):"
echo "curl http://$PUBLIC_IP:3000/health"
echo "curl http://$PUBLIC_IP:3001"
echo ""

echo "🔒 Security Recommendations:"
echo "==========================="
echo "1. Consider using HTTPS (SSL certificates)"
echo "2. Add authentication to your app"
echo "3. Monitor access logs regularly"
echo "4. Use a VPN for maximum security"
echo ""

echo "📊 Current Status:"
echo "=================="
echo "✅ Local access working: $(curl -s http://192.168.1.143:3000/health)"
echo "❓ External access: Requires port forwarding setup"
echo ""

echo "🚀 Quick Setup Steps:"
echo "====================="
echo "1. Configure port forwarding in router (see above)"
echo "2. Test from external network"
echo "3. Consider adding SSL/HTTPS"
echo "4. Set up monitoring and logging"
echo ""

echo "📚 For more options, see: EXTERNAL-ACCESS-GUIDE.md" 