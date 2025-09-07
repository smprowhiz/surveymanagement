# Survey Management Application - Environment Setup Guide

This Survey Management Application supports separate **Development** and **Production** environments with complete isolation to ensure your production data and services remain safe during development work.

## Environment Overview

### Development Environment
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:5001
- **Database**: `survey-dev.db` (completely separate from production)
- **Configuration**: `.env.development`

### Production Environment
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Database**: `survey.db` (production database)
- **Configuration**: `.env.production`

## Quick Start

### Option 1: Native Node.js (Recommended for Development)

#### Development Mode
```powershell
# Run this in PowerShell
.\start-dev.ps1
```

#### Production Mode
```powershell
# Run this in PowerShell
.\start-prod.ps1
```

### Option 2: Docker (Recommended for Production)

#### Development with Docker
```powershell
# Run this in PowerShell
.\start-docker-dev.ps1
```

#### Production with Docker
```powershell
# Run this in PowerShell
.\start-docker-prod.ps1
```

## Manual Setup

### Prerequisites
- Node.js 16+ and npm
- PowerShell (for Windows)
- Docker and Docker Compose (optional, for containerized deployment)

### 1. Install Dependencies

```powershell
# Backend dependencies
cd backend
npm install
cd ..

# Frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Environment Configuration

The application uses these environment files:
- `.env.development` - Development configuration (port 5001/3001)
- `.env.production` - Production configuration (port 5000/3000)

These files are already configured with appropriate settings for each environment.

### 3. Manual Development Mode

```powershell
# Terminal 1: Start backend development server
cd backend
npm run start:dev

# Terminal 2: Start frontend development server
cd frontend
npm run start:dev
```

### 4. Manual Production Mode

```powershell
# Terminal 1: Start backend production server
cd backend
npm run start:prod

# Terminal 2: Build and start frontend production server
cd frontend
npm run build:prod
npm run start:prod
```

## Environment Isolation Features

### Database Isolation
- **Development**: Uses `survey-dev.db`
- **Production**: Uses `survey.db`
- Completely separate databases ensure development work doesn't affect production data

### Port Isolation
- **Development Ports**: 3001 (frontend), 5001 (backend)
- **Production Ports**: 3000 (frontend), 5000 (backend)
- No port conflicts allow running both environments simultaneously

### Configuration Isolation
- **Development**: `.env.development` with relaxed security for development
- **Production**: `.env.production` with production-ready security settings

### Docker Isolation
- **Development**: `docker-compose.dev.yml` with development-specific configurations
- **Production**: `docker-compose.yml` with production optimizations

## Available Scripts

### Backend Scripts
```bash
npm run start:dev     # Start backend in development mode (port 5001)
npm run start:prod    # Start backend in production mode (port 5000)
npm run dev           # Start with nodemon for development
npm start             # Standard start (uses current .env)
```

### Frontend Scripts
```bash
npm run start:dev     # Start frontend in development mode (port 3001)
npm run start:prod    # Start frontend in production mode (port 3000)
npm run build:dev     # Build for development API
npm run build:prod    # Build for production API
```

## Testing the Environment Setup

1. **Start Development Environment**:
   ```powershell
   .\start-dev.ps1
   ```
   - Frontend should be accessible at http://localhost:3001
   - Backend API should respond at http://localhost:5001

2. **Start Production Environment** (in a separate PowerShell):
   ```powershell
   .\start-prod.ps1
   ```
   - Frontend should be accessible at http://localhost:3000
   - Backend API should respond at http://localhost:5000

3. **Verify Isolation**:
   - Both environments should run simultaneously
   - Development data should be separate from production
   - Changes in development should not affect production

## Security Notes

### Development Environment
- Uses relaxed CORS settings for development
- Includes demo data auto-seeding
- Uses development JWT secret (not for production)
- Extended JWT expiration for convenience

### Production Environment
- Stricter CORS configuration
- No auto-seeding of demo data
- Production-grade JWT secret (change before deployment)
- Shorter JWT expiration for security

## Troubleshooting

### Port Conflicts
If you encounter port conflicts:
1. Check if other applications are using ports 3000, 3001, 5000, or 5001
2. Stop existing processes or change ports in environment files

### Missing Dependencies
```powershell
# Reinstall all dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### Database Issues
- Development database: Delete `survey-dev.db` to reset
- Production database: Delete `survey.db` to reset (⚠️ WARNING: This will delete all production data)

### Docker Issues
```powershell
# Reset Docker containers
docker-compose -f docker-compose.dev.yml down --volumes
docker-compose -f docker-compose.yml down --volumes
```

## Next Steps

1. Start with the development environment to test functionality
2. Use the production environment for final testing
3. Deploy using Docker for production hosting
4. Customize environment variables as needed for your deployment

The environment setup ensures that you can safely develop new features without impacting your production data or services.
