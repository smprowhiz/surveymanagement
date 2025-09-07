# Production Environment Startup Script (Docker)
# This script starts the Survey Management app in production mode using Docker
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Survey Management App - Production Mode (Docker)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Frontend will be available at: http://localhost:3000" -ForegroundColor Green
Write-Host "Backend API will be available at: http://localhost:5000" -ForegroundColor Green
Write-Host "Database: survey.db (production database)" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

# Stop any existing production containers
Write-Host "Stopping existing production containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.yml down

# Create data directories if they don't exist
if (-not (Test-Path "data-prod")) {
    New-Item -ItemType Directory -Path "data-prod"
    Write-Host "Created data-prod directory for production database" -ForegroundColor Green
}

# Build and start production containers
Write-Host "Building and starting production containers..." -ForegroundColor Green
docker-compose -f docker-compose.yml up --build

Write-Host "Production environment stopped." -ForegroundColor Yellow
