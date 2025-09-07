# Survey Management App - Docker Environment Setup

This document explains how to run the Survey Management application using Docker Desktop with complete environment isolation.

## Environment Separation

The application supports two completely isolated environments:

### Development Environment
- **Frontend**: http://localhost:3001
- **Backend**: http://localhost:5001
- **Database**: `data-dev/survey-dev.db`
- **Container Names**: `surveyproject-frontend-dev`, `surveyproject-backend-dev`

### Production Environment
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **Database**: `data-prod/survey.db`
- **Container Names**: `surveyproject-frontend-prod`, `surveyproject-backend-prod`

## Prerequisites

1. **Docker Desktop** installed and running
2. **PowerShell** (Windows)
3. No direct Node.js installation required (everything runs in containers)

## Quick Start

### Development Environment

```powershell
# Start development environment
.\start-dev.ps1

# Stop development environment
.\stop-dev.ps1
```

### Production Environment

```powershell
# Start production environment
.\start-prod.ps1

# Stop production environment
.\stop-prod.ps1
```

### Management Commands

```powershell
# Check status of all containers
.\status.ps1

# Stop all environments
.\stop-all.ps1
```

## Environment Configuration

### Development (.env.development)
```bash
NODE_ENV=development
PORT=5001
FRONTEND_BASE_URL=http://localhost:3001
JWT_SECRET=dev-jwt-secret-key-change-in-production
BCRYPT_SALT_ROUNDS=10
JWT_EXPIRES_IN=24h
DEMO_AUTO_SEED=true
ALLOWED_ORIGINS=http://localhost:3001,http://127.0.0.1:3001
DB_NAME=survey-dev.db
```

### Production (.env.production)
```bash
NODE_ENV=production
PORT=5000
FRONTEND_BASE_URL=http://localhost:3000
JWT_SECRET=prod-jwt-secret-key-CHANGE-THIS-IN-REAL-PRODUCTION
BCRYPT_SALT_ROUNDS=12
JWT_EXPIRES_IN=1h
DEMO_AUTO_SEED=false
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
DB_NAME=survey.db
```

## Manual Docker Commands

### Development Environment

```powershell
# Build and start development containers
docker-compose -f docker-compose.dev.yml up --build

# Run in background
docker-compose -f docker-compose.dev.yml up --build -d

# Stop development containers
docker-compose -f docker-compose.dev.yml down

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

### Production Environment

```powershell
# Build and start production containers
docker-compose -f docker-compose.yml up --build

# Run in background
docker-compose -f docker-compose.yml up --build -d

# Stop production containers
docker-compose -f docker-compose.yml down

# View logs
docker-compose -f docker-compose.yml logs -f
```

## Database Management

### Development Database
- Location: `data-dev/survey-dev.db`
- Automatically seeded with demo data
- Safe for testing and development

### Production Database
- Location: `data-prod/survey.db`
- No automatic seeding
- Persistent across container restarts

### Backup Databases

```powershell
# Backup development database
Copy-Item "data-dev\survey-dev.db" "data-dev\survey-dev-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').db"

# Backup production database
Copy-Item "data-prod\survey.db" "data-prod\survey-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').db"
```

## Container Management

### View Running Containers
```powershell
docker ps --filter "name=surveyproject"
```

### View Container Logs
```powershell
# Development backend logs
docker logs surveyproject-backend-dev -f

# Development frontend logs
docker logs surveyproject-frontend-dev -f

# Production backend logs
docker logs surveyproject-backend-prod -f

# Production frontend logs
docker logs surveyproject-frontend-prod -f
```

### Execute Commands in Containers
```powershell
# Access development backend container
docker exec -it surveyproject-backend-dev sh

# Access production backend container
docker exec -it surveyproject-backend-prod sh
```

## Troubleshooting

### Port Conflicts
If you get port conflicts, ensure no other applications are using:
- Ports 3000, 3001 (frontend)
- Ports 5000, 5001 (backend)

Check with:
```powershell
netstat -an | findstr ":3000"
netstat -an | findstr ":3001"
netstat -an | findstr ":5000"
netstat -an | findstr ":5001"
```

### Container Issues
```powershell
# Remove all containers and start fresh
.\stop-all.ps1
docker container prune -f
docker image prune -f

# Rebuild everything
.\start-dev.ps1
```

### Database Issues
```powershell
# Reset development database
.\stop-dev.ps1
Remove-Item "data-dev\survey-dev.db" -Force
.\start-dev.ps1

# Reset production database
.\stop-prod.ps1
Remove-Item "data-prod\survey.db" -Force
.\start-prod.ps1
```

## Development Workflow

1. **Start Development Environment**
   ```powershell
   .\start-dev.ps1
   ```

2. **Access the Application**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:5001

3. **Make Changes**
   - Edit code in your IDE
   - Containers will automatically rebuild when you restart

4. **Test Changes**
   - Restart containers to see changes: `.\stop-dev.ps1` then `.\start-dev.ps1`

5. **Deploy to Production**
   ```powershell
   .\start-prod.ps1
   ```

## Security Notes

- Development and production environments are completely isolated
- Different databases prevent accidental data mixing
- Environment-specific JWT secrets
- Production uses stronger security settings
- Never use development settings in production

## Performance Notes

- First build may take 5-10 minutes (downloading dependencies)
- Subsequent builds are faster (Docker layer caching)
- Development environment includes additional debugging features
- Production environment is optimized for performance
