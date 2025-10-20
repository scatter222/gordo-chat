# Gordo Chat - Docker Deployment Guide

## Quick Start

Deploy Gordo Chat with Docker Compose in just 2 commands:

```bash
# 1. Copy environment variables and configure them (optional)
cp .env.example .env

# 2. Start all services
docker-compose up -d
```

That's it! Your app will be running at:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001
- **Socket.io**: http://localhost:3002

## Services

The Docker Compose setup includes:

1. **MongoDB** - Database (port 27017)
2. **Next.js App** - Frontend + API (ports 3000, 3001)
3. **Socket.io Server** - Real-time messaging (port 3002)

## Configuration

Edit `.env` to customize settings:

```bash
# MongoDB credentials
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=admin123

# NextAuth
NEXTAUTH_SECRET=your-random-secret-here
NEXTAUTH_URL=http://localhost:3000

# JWT
JWT_SECRET=your-random-jwt-secret-here

# Socket.io
NEXT_PUBLIC_SOCKET_URL=http://localhost:3002
```

## Common Commands

```bash
# Start services (background)
docker-compose up -d

# Start services (foreground, see logs)
docker-compose up

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f nextjs-app

# Rebuild images
docker-compose build

# Rebuild and restart
docker-compose up -d --build

# Remove all data (including MongoDB)
docker-compose down -v
```

## Production Setup

For production deployment:

1. **Generate secure secrets**:
   ```bash
   openssl rand -base64 32  # For NEXTAUTH_SECRET
   openssl rand -base64 32  # For JWT_SECRET
   ```

2. **Update .env**:
   ```bash
   NODE_ENV=production
   NEXTAUTH_SECRET=<your-secure-secret>
   JWT_SECRET=<your-secure-jwt-secret>
   NEXTAUTH_URL=https://yourdomain.com
   NEXT_PUBLIC_SOCKET_URL=https://yourdomain.com:3002
   ```

3. **Use strong MongoDB credentials**:
   ```bash
   MONGO_INITDB_ROOT_USERNAME=<strong-username>
   MONGO_INITDB_ROOT_PASSWORD=<strong-password>
   ```

4. **Start services**:
   ```bash
   docker-compose up -d
   ```

## Accessing the Database

Connect to MongoDB from your machine:

```bash
# Using mongosh
mongosh mongodb://admin:admin123@localhost:27017/gordo-chat --authenticationDatabase admin
```

## Data Persistence

- MongoDB data is stored in the `mongodb_data` volume
- All services are configured to restart automatically if they crash

## Troubleshooting

### Services won't start

```bash
# Check service health
docker-compose ps

# View full logs
docker-compose logs

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Connection issues

```bash
# Verify services are running
docker-compose ps

# Check if ports are available
lsof -i :3000
lsof -i :3001
lsof -i :3002
lsof -i :27017

# Restart services
docker-compose restart
```

### Memory issues

If running on limited resources, you can reduce resource allocation in `docker-compose.yml`:

```yaml
services:
  nextjs-app:
    # Add memory limit
    deploy:
      resources:
        limits:
          memory: 512M
```

## Upgrade Guide

To update the application:

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build

# Verify everything is working
docker-compose logs -f nextjs-app
```

## Security Notes

- Change default MongoDB credentials in `.env`
- Use strong NEXTAUTH_SECRET and JWT_SECRET
- For production, use HTTPS and secure networking
- Keep Docker images updated: `docker-compose build --no-cache`
- Use environment variables for sensitive data, never commit `.env` to git

## Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Verify all services are running: `docker-compose ps`
- Check port availability: `lsof -i :3000` (etc.)
