# Stop Development Environment
# This script stops all development containers

Write-Host "Stopping Development Environment..." -ForegroundColor Yellow

# Stop development containers
docker-compose -f docker-compose.dev.yml down

Write-Host "Development environment stopped." -ForegroundColor Green
Write-Host "Development containers are now offline." -ForegroundColor Cyan
