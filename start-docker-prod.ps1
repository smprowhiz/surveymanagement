# Docker Production Environment Script
# This script starts the Survey Management app using Docker Compose for production
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Survey Management App - Docker Production" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Frontend will be available at: http://localhost:3000" -ForegroundColor Green
Write-Host "Backend API will be available at: http://localhost:5000" -ForegroundColor Green
Write-Host "Using Docker containers for production deployment" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

# Stop any existing production containers
Write-Host "Stopping any existing production containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.yml down

# Build and start production containers
Write-Host "Building and starting production containers..." -ForegroundColor Green
docker-compose -f docker-compose.yml up --build

Write-Host "Production environment started successfully!" -ForegroundColor Green
