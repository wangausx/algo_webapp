# Home Network Deployment Guide
## Algo Trading WebApp on 192.168.1.143

This guide walks you through deploying your algo trading application on your home network with static IP 192.168.1.143.

## Prerequisites

### 1. Install Docker Desktop (Windows)
1. Download Docker Desktop from: https://docs.docker.com/desktop/windows/install/
2. Install Docker Desktop on your Windows machine
3. Start Docker Desktop

### 2. Enable WSL2 Integration
1. Open Docker Desktop
2. Go to **Settings** → **General**
3. Check **"Use WSL 2 based engine"**
4. Go to **Settings** → **Resources** → **WSL Integration**
5. Enable integration with your WSL2 distribution (Ubuntu)
6. Click **"Apply & Restart"**

### 3. Verify Installation
Open your WSL2 terminal and run:
```bash
docker --version
docker-compose --version
```

## Quick Start

### Option 1: Automated Deployment (Recommended)
```bash
# Navigate to your project directory
cd /home/wangausx/algo_webapp

# Start the application
./start-home-deployment.sh
```

### Option 2: Manual Deployment
```bash
# Stop any existing containers
docker-compose -f docker-compose.home.yml down

# Build and start containers
docker-compose -f docker-compose.home.yml up -d --build

# Check status
docker-compose -f docker-compose.home.yml ps
```

## Access Your Application

### From Your Computer
- **Frontend**: http://192.168.1.143:3000
- **Mock API**: http://192.168.1.143:3001

### From Other Devices on Your Network
Any device connected to your home WiFi can access:
- **Frontend**: http://192.168.1.143:3000

This includes:
- 📱 Mobile phones
- 💻 Other laptops
- 📺 Smart TVs with browsers
- 🖥️ Other computers on your network

## Management Commands

### Check Application Status
```bash
./check-status.sh
```

### View Live Logs
```bash
docker-compose -f docker-compose.home.yml logs -f
```

### Stop Application
```bash
docker-compose -f docker-compose.home.yml down
```

### Restart Application
```bash
docker-compose -f docker-compose.home.yml restart
```

### Rebuild Application (after code changes)
```bash
docker-compose -f docker-compose.home.yml down
docker-compose -f docker-compose.home.yml up -d --build
```

## Troubleshooting

### 1. Docker Not Found
**Error**: `The command 'docker' could not be found`
**Solution**: 
- Make sure Docker Desktop is running
- Enable WSL2 integration in Docker Desktop settings
- Restart WSL2: `wsl --shutdown` then reopen terminal

### 2. Port Already in Use
**Error**: Port 3000 or 3001 already in use
**Solution**:
```bash
# Check what's using the port
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :3001

# Stop the application
docker-compose -f docker-compose.home.yml down

# Kill any processes using the ports if needed
sudo kill -9 <PID>
```

### 3. Cannot Access from Other Devices
**Check**:
1. Windows Firewall settings
2. Router firewall settings
3. Make sure devices are on the same network (192.168.1.x)

**Solution**:
```bash
# Allow ports through Windows firewall (run in Windows PowerShell as Admin)
New-NetFirewallRule -DisplayName "Algo Trading App" -Direction Inbound -Port 3000,3001 -Protocol TCP -Action Allow
```

### 4. Container Build Issues
**Solution**:
```bash
# Clean Docker cache
docker system prune -f

# Rebuild without cache
docker-compose -f docker-compose.home.yml build --no-cache
```

## Network Configuration

### Your Current Setup
- **Router IP**: 192.168.1.254
- **Your Computer IP**: 192.168.1.143 (static)
- **Subnet**: 255.255.255.0 (192.168.1.0/24)

### Accessible From
Any device with IP in range: 192.168.1.1 - 192.168.1.253

## What's Currently Running

### Frontend (Port 3000)
- React application with your trading interface
- Nginx web server serving static files
- Configured for home network access

### Mock Backend (Port 3001)
- **Temporary**: Simple mock API responses
- **Purpose**: Allows frontend to load without errors
- **Next Step**: Replace with your actual backend service

## Adding a Real Backend

When you have your backend service ready:

1. **Update docker-compose.home.yml**:
```yaml
# Replace mock-backend with:
backend:
  build:
    context: ./backend  # Path to your backend code
    dockerfile: Dockerfile
  ports:
    - "3001:3001"
  environment:
    - NODE_ENV=production
    - ANTHROPIC_API_KEY=your_api_key_here
```

2. **Update nginx configuration** to proxy to real backend instead of mock-backend

## Security Considerations

### Current Status: Development Setup
- ⚠️ No HTTPS (HTTP only)
- ⚠️ No authentication on network level
- ⚠️ Basic security headers only

### For Production Use:
1. Set up HTTPS with SSL certificates
2. Configure proper authentication
3. Set up VPN for external access
4. Regular security updates

## File Structure

```
algo_webapp/
├── docker-compose.home.yml     # Home network Docker config
├── nginx.home.conf            # Custom nginx config
├── start-home-deployment.sh   # Automated deployment
├── check-status.sh           # Status checker
├── mock-api/                 # Temporary mock responses
│   ├── api/
│   └── router/
└── src/                      # Your React application
```

## Next Steps

1. ✅ **Current**: Frontend running with mock API
2. 🔄 **Next**: Add your actual backend service
3. 🔄 **Future**: Add database integration
4. 🔄 **Advanced**: Set up SSL/HTTPS
5. 🔄 **Advanced**: External access via VPN or domain

## Support

If you encounter issues:

1. **Check logs**: `./check-status.sh`
2. **Restart services**: `./start-home-deployment.sh`
3. **Clean rebuild**: 
   ```bash
   docker-compose -f docker-compose.home.yml down
   docker system prune -f
   ./start-home-deployment.sh
   ```

Your algo trading application is now ready for home network access! 🚀 