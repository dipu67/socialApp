# VPS Deployment Guide

This guide helps you deploy the chat application to a VPS with automatic image URL management.

## Environment Configuration

The application automatically manages MinIO URLs based on your environment configuration.

### Environment Variables Priority

1. **MINIO_PUBLIC_URL** - Direct public URL for file access
2. **MINIO_PUBLIC_ENDPOINT** - Custom endpoint (for reverse proxy setups)
3. **DOMAIN + :9000** - Domain-based URL
4. **VPS_IP + :9000** - IP-based URL
5. **MINIO_ENDPOINT** - Fallback to main endpoint

### Configuration Examples

#### Option 1: Domain-based Configuration
```env
DOMAIN=yourdomain.com
MINIO_ENDPOINT=http://yourdomain.com:9000
MINIO_PUBLIC_URL=https://yourdomain.com:9000
```

#### Option 2: IP-based Configuration  
```env
VPS_IP=192.168.1.100
MINIO_ENDPOINT=http://192.168.1.100:9000
MINIO_PUBLIC_URL=http://192.168.1.100:9000
```

#### Option 3: Reverse Proxy Configuration
```env
DOMAIN=yourdomain.com
MINIO_ENDPOINT=http://localhost:9000
MINIO_PUBLIC_ENDPOINT=https://files.yourdomain.com
```

## VPS Setup Steps

### 1. Install Docker and Docker Compose
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Clone and Configure
```bash
git clone <your-repo>
cd chat-app
cp .env.production.example .env.local
# Edit .env.local with your VPS details
```

### 3. Update Docker Compose for Production
```yaml
# Add to compose.yaml for production
services:
  minio:
    environment:
      MINIO_ROOT_USER: your-secure-access-key
      MINIO_ROOT_PASSWORD: your-secure-secret-key
    volumes:
      - /var/lib/minio/data:/data
```

### 4. Configure Firewall
```bash
# Open required ports
sudo ufw allow 3000  # Next.js app
sudo ufw allow 9000  # MinIO API
sudo ufw allow 9001  # MinIO Console
sudo ufw allow 27017 # MongoDB (if external access needed)
```

### 5. Deploy
```bash
docker-compose up -d
npm install
npm run build
npm start
```

## Image URL Management Features

### Automatic URL Generation
- Development: `http://localhost:9000/bucket/file`
- VPS: `http://your-vps-ip:9000/bucket/file`
- Domain: `https://yourdomain.com:9000/bucket/file`

### Smart Image Deletion
- Only deletes images from MinIO URLs
- Ignores external URLs (avatars, etc.)
- Supports multiple URL patterns

### Next.js Image Optimization
- Automatically configures allowed domains
- Supports dynamic VPS IP/domain detection
- Handles HTTP and HTTPS protocols

## Reverse Proxy Configuration (Optional)

For cleaner URLs, configure nginx:

```nginx
# /etc/nginx/sites-available/minio
server {
    listen 80;
    server_name files.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Then use:
```env
MINIO_PUBLIC_ENDPOINT=https://files.yourdomain.com
```

## SSL/TLS Configuration

For HTTPS support:

1. Install Certbot:
```bash
sudo apt install certbot python3-certbot-nginx
```

2. Generate certificates:
```bash
sudo certbot --nginx -d yourdomain.com -d files.yourdomain.com
```

3. Update environment:
```env
MINIO_PUBLIC_URL=https://files.yourdomain.com
```

## Monitoring and Logs

```bash
# View application logs
docker-compose logs -f

# Monitor MinIO
docker-compose logs -f minio

# Check bucket status
curl http://your-vps-ip:3000/api/minio-status
```

## Troubleshooting

### Images not loading
1. Check firewall: `sudo ufw status`
2. Verify MinIO status: `docker-compose ps`
3. Test bucket access: `curl http://your-vps-ip:9000/profile-images/`

### Upload failures
1. Check MinIO credentials in .env.local
2. Verify bucket permissions: `docker exec minio mc anonymous get local/profile-images`
3. Check application logs for auth errors

### URL mismatch
1. Verify environment variables
2. Restart application after env changes
3. Check Next.js image domains configuration
