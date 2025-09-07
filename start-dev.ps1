# Development Environment Startup Script (Docker)
# This script starts the Survey Management app in development mode using Docker
# Frontend: http://localhost:3001
# Backend API: http://localhost:5001

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Survey Management App - Development Mode (Docker)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Frontend will be available at: http://localhost:3001" -ForegroundColor Green
Write-Host "Backend API will be available at: http://localhost:5001" -ForegroundColor Green
Write-Host "Database: survey-dev.db (isolated from production)" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

# Stop any existing development containers
Write-Host "Stopping existing development containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml down

# Create data directories if they don't exist
if (-not (Test-Path "data-dev")) {
    New-Item -ItemType Directory -Path "data-dev"
    Write-Host "Created data-dev directory for development database" -ForegroundColor Green
}

# Build and start development containers
Write-Host "Building and starting development containers..." -ForegroundColor Green
docker-compose -f docker-compose.dev.yml up --build

Write-Host "Development environment stopped." -ForegroundColor Yellow
