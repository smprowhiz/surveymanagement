# Stop All Environments
# This script stops both development and production containers

Write-Host "Stopping All Survey Management Environments..." -ForegroundColor Yellow

# Stop all containers
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.yml down

# Show running containers
Write-Host "`nChecking for any remaining containers..." -ForegroundColor Cyan
docker ps --filter "name=surveyproject"

Write-Host "`nAll Survey Management environments stopped." -ForegroundColor Green
