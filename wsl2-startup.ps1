# WSL2 Automatic Startup and Port Forwarding Script
# This script should be added to Windows startup or Task Scheduler

# Configuration
$PORTS = @(8080, 3000, 3001)
$RULE_PREFIX = "WSL2-Docker"
$LOG_FILE = "$env:TEMP\wsl2-networking.log"

function Write-Log {
    param($Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    Write-Host $logMessage
    Add-Content -Path $LOG_FILE -Value $logMessage
}

function Get-WSL2-IP {
    try {
        $wslIP = wsl hostname -I 2>$null
        if ($wslIP) {
            return $wslIP.Trim().Split(' ')[0]
        }
    } catch {
        Write-Log "Error getting WSL2 IP: $_"
    }
    return $null
}

function Update-PortForwarding {
    param($Port, $WSL_IP)
    
    try {
        # Remove existing rule
        netsh interface portproxy delete v4tov4 listenport=$Port listenaddress=0.0.0.0 2>$null
        
        # Add new rule
        $result = netsh interface portproxy add v4tov4 listenport=$Port listenaddress=0.0.0.0 connectport=$Port connectaddress=$WSL_IP
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Port forwarding updated for port $Port -> $WSL_IP"
            
            # Ensure firewall rule exists
            netsh advfirewall firewall delete rule name="$RULE_PREFIX-Port-$Port" 2>$null
            netsh advfirewall firewall add rule name="$RULE_PREFIX-Port-$Port" dir=in action=allow protocol=TCP localport=$Port 2>$null
        } else {
            Write-Log "Failed to update port forwarding for port $Port"
        }
    } catch {
        Write-Log "Error updating port forwarding for port $Port: $_"
    }
}

function Start-WSL2Networking {
    Write-Log "Starting WSL2 networking setup..."
    
    # Wait for WSL2 to be ready
    $maxAttempts = 30
    $attempt = 0
    
    do {
        $wslIP = Get-WSL2-IP
        if ($wslIP) {
            break
        }
        
        $attempt++
        Write-Log "Waiting for WSL2 to be ready... (attempt $attempt/$maxAttempts)"
        Start-Sleep -Seconds 2
        
    } while ($attempt -lt $maxAttempts)
    
    if (-not $wslIP) {
        Write-Log "WSL2 is not accessible after $maxAttempts attempts"
        return
    }
    
    Write-Log "WSL2 IP detected: $wslIP"
    
    # Update port forwarding for all configured ports
    foreach ($port in $PORTS) {
        Update-PortForwarding -Port $port -WSL_IP $wslIP
    }
    
    Write-Log "WSL2 networking setup completed"
    Write-Log "Your applications should now be accessible from the home network:"
    foreach ($port in $PORTS) {
        Write-Log "  - http://192.168.1.143:$port"
    }
}

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Log "ERROR: This script must be run as Administrator"
    exit 1
}

# Main execution
Write-Log "WSL2 Networking Startup Script initiated"
Start-WSL2Networking 