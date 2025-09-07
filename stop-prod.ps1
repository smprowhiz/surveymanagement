# Stop Production Environment
# This script stops all production containers

Write-Host "Stopping Production Environment..." -ForegroundColor Yellow

# Stop production containers
docker-compose -f docker-compose.yml down

Write-Host "Production environment stopped." -ForegroundColor Green
Write-Host "Production containers are now offline." -ForegroundColor Cyan
