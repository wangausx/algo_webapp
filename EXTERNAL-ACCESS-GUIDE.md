# External Access Guide for Algo Trading App
## Enabling Remote Access to 192.168.1.143

This guide shows you how to make your application accessible from anywhere on the internet.

## Option 1: Port Forwarding (Recommended for Home Use)

### Step 1: Access Your Router
1. Open browser and go to: `http://192.168.1.254` (your router IP)
2. Login with your router credentials
3. Look for "Port Forwarding" or "Virtual Server" settings

### Step 2: Configure Port Forwarding
Add these rules to your AT&T router:

| External Port | Internal IP | Internal Port | Protocol | Description |
|---------------|-------------|---------------|----------|-------------|
| 3000 | 192.168.1.143 | 3000 | TCP | Frontend App |
| 3001 | 192.168.1.143 | 3001 | TCP | API Backend |

### Step 3: Get Your Public IP
```bash
# Check your public IP address
curl -s https://ipinfo.io/ip
```

### Step 4: Access Your App
Once port forwarding is set up:
- **Frontend**: `http://YOUR_PUBLIC_IP:3000`
- **API**: `http://YOUR_PUBLIC_IP:3001`

## Option 2: Dynamic DNS + Port Forwarding

### Step 1: Set Up Dynamic DNS
1. Sign up for a free DDNS service (No-IP, DuckDNS, etc.)
2. Configure your router with DDNS settings
3. Your domain will automatically update when your IP changes

### Step 2: Configure Router
- Enable DDNS in router settings
- Add your DDNS credentials
- Set up port forwarding as above

### Step 3: Access Your App
- **Frontend**: `http://yourdomain.ddns.net:3000`
- **API**: `http://yourdomain.ddns.net:3001`

## Option 3: VPN Solution (Most Secure)

### Step 1: Set Up VPN Server
```bash
# Install WireGuard (example)
sudo apt update
sudo apt install wireguard

# Generate keys
wg genkey | sudo tee /etc/wireguard/private.key
sudo cat /etc/wireguard/private.key | wg pubkey | sudo tee /etc/wireguard/public.key
```

### Step 2: Configure WireGuard
Create `/etc/wireguard/wg0.conf`:
```ini
[Interface]
PrivateKey = YOUR_PRIVATE_KEY
Address = 10.0.0.1/24
ListenPort = 51820
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE
```

### Step 3: Port Forward VPN
- External Port: 51820
- Internal IP: 192.168.1.143
- Internal Port: 51820
- Protocol: UDP

### Step 4: Access Your App
Connect to VPN, then access:
- **Frontend**: `http://192.168.1.143:3000`
- **API**: `http://192.168.1.143:3001`

## Option 4: Cloud Tunnel (Easiest)

### Step 1: Install Cloudflare Tunnel
```bash
# Download cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Authenticate
cloudflared tunnel login
```

### Step 2: Create Tunnel
```bash
# Create tunnel
cloudflared tunnel create algo-trading-app

# Configure tunnel
cat > ~/.cloudflared/config.yml << EOF
tunnel: YOUR_TUNNEL_ID
credentials-file: ~/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: your-app.your-domain.com
    service: http://localhost:3000
  - hostname: api.your-app.your-domain.com
    service: http://localhost:3001
  - service: http_status:404
EOF
```

### Step 3: Run Tunnel
```bash
# Start tunnel
cloudflared tunnel run algo-trading-app

# Or run as service
sudo cloudflared service install
```

## Security Considerations

### 1. Firewall Configuration
```bash
# Allow only necessary ports
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
sudo ufw enable
```

### 2. SSL/HTTPS Setup
For production use, add SSL certificates:
```bash
# Install certbot
sudo apt install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d yourdomain.com
```

### 3. Authentication
Consider adding authentication to your app:
- Basic auth in nginx
- OAuth integration
- API key authentication

## Testing External Access

### 1. Test from External Network
```bash
# Test from a different network (mobile data, etc.)
curl http://YOUR_PUBLIC_IP:3000/health
```

### 2. Check Router Logs
Monitor your router's admin panel for:
- Connection attempts
- Port forwarding status
- DDNS updates

### 3. Monitor Application Logs
```bash
# Check nginx access logs
docker-compose -f docker-compose.home.yml logs frontend

# Check for external connections
docker-compose -f docker-compose.home.yml exec frontend tail -f /var/log/nginx/access.log
```

## Troubleshooting

### Port Forwarding Issues
1. **Check router settings**: Ensure ports are correctly forwarded
2. **Test internal access**: `curl http://192.168.1.143:3000`
3. **Check firewall**: Ensure Windows firewall allows the ports
4. **Verify ISP**: Some ISPs block certain ports

### Dynamic DNS Issues
1. **Check DDNS status**: Verify domain resolves to your IP
2. **Update frequency**: Some DDNS services have update limits
3. **Router compatibility**: Ensure your router supports your DDNS provider

### VPN Issues
1. **Check WireGuard status**: `sudo wg show`
2. **Verify port forwarding**: UDP port 51820
3. **Test connectivity**: `ping 10.0.0.1` from client

## Recommended Setup for Your Use Case

### For Personal/Development Use:
1. **Port Forwarding** (Option 1) - Simple and effective
2. **Dynamic DNS** - If you want a domain name
3. **Basic firewall rules** - Security

### For Production/Security:
1. **VPN Solution** (Option 3) - Most secure
2. **SSL certificates** - HTTPS encryption
3. **Authentication** - User access control

### For Easiest Setup:
1. **Cloudflare Tunnel** (Option 4) - No router configuration needed
2. **Automatic SSL** - Built-in HTTPS
3. **Domain management** - Easy DNS setup

## Quick Start Commands

### Check Current Setup
```bash
# Get your public IP
curl -s https://ipinfo.io/ip

# Test current accessibility
curl -s http://192.168.1.143:3000/health
```

### Enable Port Forwarding (Manual)
1. Access router at `http://192.168.1.254`
2. Find "Port Forwarding" section
3. Add rules for ports 3000 and 3001
4. Point to internal IP `192.168.1.143`

Your app will then be accessible at:
- `http://YOUR_PUBLIC_IP:3000` 