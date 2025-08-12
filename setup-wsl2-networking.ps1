# WSL2 Networking Setup Script
# Run this as Administrator in Windows PowerShell

param(
    [switch]$Install,
    [switch]$Uninstall,
    [switch]$Status
)

# Configuration
$WSL_IP = "192.168.1.143"  # Your current WSL2 IP
$PORTS = @(8082, 3000, 3001, 3003)  # Ports to forward (added 8082 for frontend, 3003 for backend)
$RULE_PREFIX = "WSL2-Docker"

function Get-WSL2-IP {
    $wslIP = wsl hostname -I
    if ($wslIP) {
        return $wslIP.Trim().Split(' ')[0]
    }
    return $null
}

function Add-PortForwarding {
    param($Port)
    
    $currentWSLIP = Get-WSL2-IP
    if (-not $currentWSLIP) {
        Write-Error "Could not get WSL2 IP address"
        return
    }
    
    Write-Host "Adding port forwarding for port $Port to WSL2 IP $currentWSLIP" -ForegroundColor Green
    
    # Remove existing rule if it exists
    netsh interface portproxy delete v4tov4 listenport=$Port listenaddress=0.0.0.0 2>$null
    
    # Add new rule
    netsh interface portproxy add v4tov4 listenport=$Port listenaddress=0.0.0.0 connectport=$Port connectaddress=$currentWSLIP
    
    # Add firewall rule
    netsh advfirewall firewall delete rule name="$RULE_PREFIX-Port-$Port" 2>$null
    netsh advfirewall firewall add rule name="$RULE_PREFIX-Port-$Port" dir=in action=allow protocol=TCP localport=$Port
}

function Remove-PortForwarding {
    param($Port)
    
    Write-Host "Removing port forwarding for port $Port" -ForegroundColor Yellow
    
    # Remove port proxy rule
    netsh interface portproxy delete v4tov4 listenport=$Port listenaddress=0.0.0.0 2>$null
    
    # Remove firewall rule
    netsh advfirewall firewall delete rule name="$RULE_PREFIX-Port-$Port" 2>$null
}

function Show-Status {
    Write-Host "=== WSL2 Networking Status ===" -ForegroundColor Cyan
    
    $wslIP = Get-WSL2-IP
    if ($wslIP) {
        Write-Host "WSL2 IP Address: $wslIP" -ForegroundColor Green
    } else {
        Write-Host "WSL2 is not running or not accessible" -ForegroundColor Red
        return
    }
    
    Write-Host "`n=== Port Proxy Rules ===" -ForegroundColor Cyan
    $proxyRules = netsh interface portproxy show v4tov4
    if ($proxyRules -match "Listen on") {
        $proxyRules
    } else {
        Write-Host "No port proxy rules found" -ForegroundColor Yellow
    }
    
    Write-Host "`n=== Firewall Rules ===" -ForegroundColor Cyan
    $firewallRules = netsh advfirewall firewall show rule name="$RULE_PREFIX*" 2>$null
    if ($firewallRules) {
        $firewallRules | Select-String "Rule Name|Enabled|Direction|Profiles|LocalPort"
    } else {
        Write-Host "No WSL2 Docker firewall rules found" -ForegroundColor Yellow
    }
}

function Install-WSL2Networking {
    Write-Host "=== Installing WSL2 Networking Configuration ===" -ForegroundColor Green
    
    # Check if running as administrator
    if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
        Write-Error "This script must be run as Administrator"
        exit 1
    }
    
    foreach ($port in $PORTS) {
        Add-PortForwarding -Port $port
    }
    
    Write-Host "`nWSL2 networking configuration completed!" -ForegroundColor Green
    Write-Host "Your application should now be accessible from your home network." -ForegroundColor Green
    
    Show-Status
}

function Uninstall-WSL2Networking {
    Write-Host "=== Removing WSL2 Networking Configuration ===" -ForegroundColor Yellow
    
    foreach ($port in $PORTS) {
        Remove-PortForwarding -Port $port
    }
    
    Write-Host "`nWSL2 networking configuration removed!" -ForegroundColor Green
}

# Main execution
if ($Install) {
    Install-WSL2Networking
} elseif ($Uninstall) {
    Uninstall-WSL2Networking
} elseif ($Status) {
    Show-Status
} else {
    Write-Host "WSL2 Docker Networking Setup Script" -ForegroundColor Cyan
    Write-Host "Usage:" -ForegroundColor White
    Write-Host "  .\setup-wsl2-networking.ps1 -Install    # Install port forwarding" -ForegroundColor Gray
    Write-Host "  .\setup-wsl2-networking.ps1 -Uninstall  # Remove port forwarding" -ForegroundColor Gray
    Write-Host "  .\setup-wsl2-networking.ps1 -Status     # Show current status" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Note: Must be run as Administrator" -ForegroundColor Yellow
} 