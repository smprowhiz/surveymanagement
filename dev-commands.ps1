# Development Environment Commands for SurveyProject
# This preserves the production containers on 3000/5000 while allowing development on 3001/5001

Write-Host "SurveyProject Development Environment" -ForegroundColor Green

# Development commands (ports 3001/5001)
function Start-Dev {
    Write-Host "Starting development containers on ports 3001/5001..." -ForegroundColor Yellow
    docker-compose -f docker-compose.dev.yml up --build -d
}

function Stop-Dev {
    Write-Host "Stopping development containers..." -ForegroundColor Yellow
    docker-compose -f docker-compose.dev.yml down
}

function Logs-Dev {
    Write-Host "Showing development container logs..." -ForegroundColor Yellow
    docker-compose -f docker-compose.dev.yml logs -f
}

function Status-Dev {
    Write-Host "Development containers status:" -ForegroundColor Yellow
    docker-compose -f docker-compose.dev.yml ps
}

# Production preservation commands (ports 3000/5000)
function Status-Prod {
    Write-Host "Production containers status:" -ForegroundColor Green
    docker-compose ps
}

# Export functions
Export-ModuleMember -Function Start-Dev, Stop-Dev, Logs-Dev, Status-Dev, Status-Prod

Write-Host "Available commands:" -ForegroundColor Cyan
Write-Host "  Start-Dev    - Start development environment (3001/5001)" -ForegroundColor White
Write-Host "  Stop-Dev     - Stop development environment" -ForegroundColor White
Write-Host "  Logs-Dev     - View development logs" -ForegroundColor White
Write-Host "  Status-Dev   - Check development container status" -ForegroundColor White
Write-Host "  Status-Prod  - Check production container status (3000/5000)" -ForegroundColor White
