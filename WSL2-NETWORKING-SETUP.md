# WSL2 Networking Setup Guide

This guide will configure permanent networking for WSL2 to allow access to your Docker applications from your home network.

## Overview

The setup includes:
- **Port forwarding** from Windows to WSL2
- **Firewall configuration** to allow external access
- **Automatic startup** scripts to maintain connectivity
- **WSL2 optimization** for better networking performance

## Quick Setup (Recommended)

### Step 1: Install Port Forwarding

1. **Copy the PowerShell script** `setup-wsl2-networking.ps1` to your Windows desktop
2. **Open PowerShell as Administrator**
3. **Run the installation**:
   ```powershell
   .\setup-wsl2-networking.ps1 -Install
   ```

### Step 2: Configure WSL2

1. **Copy `.wslconfig`** to your Windows user directory:
   ```powershell
   Copy-Item .\.wslconfig $env:USERPROFILE\.wslconfig
   ```

2. **Restart WSL2**:
   ```powershell
   wsl --shutdown
   ```

3. **Start your WSL2 terminal** (it will restart automatically)

### Step 3: Test Access

Your application should now be accessible from your home network:
- **Development**: http://192.168.1.143:8080
- **Production**: http://192.168.1.143:3000
- **Backend**: http://192.168.1.143:3001

## Automatic Startup (Optional)

To automatically configure networking when Windows starts:

### Option A: Task Scheduler (Recommended)

1. **Open Task Scheduler** (`Win + R`, type `taskschd.msc`)
2. **Create Basic Task**:
   - Name: "WSL2 Networking Setup"
   - Trigger: "When the computer starts"
   - Action: "Start a program"
   - Program: `PowerShell.exe`
   - Arguments: `-ExecutionPolicy Bypass -File "C:\Path\To\wsl2-startup.ps1"`
   - Run with highest privileges: ✅

### Option B: Startup Folder

1. **Copy `wsl2-startup.ps1`** to Windows startup folder:
   ```powershell
   $startupPath = [Environment]::GetFolderPath("Startup")
   Copy-Item .\wsl2-startup.ps1 $startupPath
   ```

## Manual Configuration

If you prefer to set up manually:

### 1. Port Forwarding

```powershell
# Get WSL2 IP
$wslIP = (wsl hostname -I).Trim()

# Add port forwarding rules
netsh interface portproxy add v4tov4 listenport=8080 listenaddress=0.0.0.0 connectport=8080 connectaddress=$wslIP
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=$wslIP
netsh interface portproxy add v4tov4 listenport=3001 listenaddress=0.0.0.0 connectport=3001 connectaddress=$wslIP
```

### 2. Firewall Rules

```powershell
# Allow ports through Windows Firewall
netsh advfirewall firewall add rule name="WSL2-Docker-Port-8080" dir=in action=allow protocol=TCP localport=8080
netsh advfirewall firewall add rule name="WSL2-Docker-Port-3000" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="WSL2-Docker-Port-3001" dir=in action=allow protocol=TCP localport=3001
```

## Troubleshooting

### Check Status

Run the status command to verify configuration:
```powershell
.\setup-wsl2-networking.ps1 -Status
```

### Common Issues

#### 1. Access Denied Error
- **Problem**: Script must run as Administrator
- **Solution**: Right-click PowerShell → "Run as Administrator"

#### 2. WSL2 IP Changes
- **Problem**: WSL2 IP address changes after restart
- **Solution**: Use the startup script to automatically update

#### 3. Firewall Blocking
- **Problem**: Windows Firewall blocks external access
- **Solution**: Ensure firewall rules are properly created

#### 4. Application Not Accessible
- **Problem**: Application not responding on expected port
- **Solution**: Verify Docker container is running:
  ```bash
  docker ps
  netstat -tlnp | grep :8080
  ```

### Verify Network Configuration

#### From WSL2:
```bash
# Check if application is running
docker ps
curl -I http://localhost:8080

# Check WSL2 IP
hostname -I
```

#### From Windows:
```powershell
# Check port forwarding
netsh interface portproxy show v4tov4

# Test connection
Test-NetConnection -ComputerName localhost -Port 8080
```

#### From Another Device:
```bash
# Test from another device on your network
curl -I http://192.168.1.143:8080
```

## Network Architecture

### Before (Docker Desktop):
```
Home Network → Windows (Docker Desktop) → Container
192.168.1.143:8080 ✅ Direct access
```

### After (Native Docker with WSL2):
```
Home Network → Windows → WSL2 → Container
192.168.1.143:8080 ✅ Via port forwarding
```

## Performance Benefits

This setup maintains the performance benefits of native Docker while enabling network access:

- **CPU Usage**: ~8-13% reduction vs Docker Desktop
- **Memory Usage**: ~1-1.5GB RAM savings
- **Startup Time**: 2-3x faster container startup
- **Network Access**: Full home network connectivity

## Maintenance

### Update WSL2 IP

If WSL2 IP changes, update port forwarding:
```powershell
.\setup-wsl2-networking.ps1 -Install
```

### Remove Configuration

To remove all networking configuration:
```powershell
.\setup-wsl2-networking.ps1 -Uninstall
```

### Restart WSL2

If networking issues occur:
```powershell
wsl --shutdown
# Wait 10 seconds, then restart your WSL2 terminal
```

## Security Considerations

1. **Firewall Rules**: Only required ports are opened
2. **Network Isolation**: WSL2 containers are isolated from Windows
3. **Access Control**: Consider using reverse proxy for production
4. **Updates**: Keep WSL2 and Docker updated regularly

## Files Summary

| File | Purpose | Location |
|------|---------|----------|
| `setup-wsl2-networking.ps1` | Main setup script | Project root |
| `wsl2-startup.ps1` | Automatic startup script | Project root |
| `.wslconfig` | WSL2 configuration | `%USERPROFILE%\.wslconfig` |
| `WSL2-NETWORKING-SETUP.md` | This guide | Project root |

## Support

If you encounter issues:

1. **Check the logs**: `%TEMP%\wsl2-networking.log`
2. **Verify WSL2 status**: `wsl --status`
3. **Test networking**: Use the troubleshooting commands above
4. **Restart WSL2**: `wsl --shutdown` and restart

Your WSL2 Docker setup is now configured for permanent home network access! 🚀 