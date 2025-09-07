# Docker Development Environment Script
# This script starts the Survey Management app using Docker Compose for development
# Frontend: http://localhost:3001
# Backend API: http://localhost:5001

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Survey Management App - Docker Development" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Frontend will be available at: http://localhost:3001" -ForegroundColor Green
Write-Host "Backend API will be available at: http://localhost:5001" -ForegroundColor Green
Write-Host "Using Docker containers for isolation" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

# Stop any existing development containers
Write-Host "Stopping any existing development containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml down

# Build and start development containers
Write-Host "Building and starting development containers..." -ForegroundColor Green
docker-compose -f docker-compose.dev.yml up --build

Write-Host "Development environment started successfully!" -ForegroundColor Green
