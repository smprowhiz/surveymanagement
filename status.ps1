# Check Status of Survey Management Containers
# This script shows the status of all related containers

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Survey Management App - Container Status" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nDevelopment Environment (ports 3001/5001):" -ForegroundColor Yellow
$devContainers = docker ps --filter "name=surveyproject" --filter "name=dev" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
if ($devContainers) {
    Write-Host $devContainers -ForegroundColor Green
} else {
    Write-Host "No development containers running" -ForegroundColor Red
}

Write-Host "`nProduction Environment (ports 3000/5000):" -ForegroundColor Yellow
$prodContainers = docker ps --filter "name=surveyproject" --filter "name=prod" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
if ($prodContainers) {
    Write-Host $prodContainers -ForegroundColor Green
} else {
    Write-Host "No production containers running" -ForegroundColor Red
}

Write-Host "`nAll Survey Management Containers:" -ForegroundColor Yellow
docker ps --filter "name=surveyproject" --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"

Write-Host "`nDocker Images:" -ForegroundColor Yellow
docker images --filter "reference=surveyproject*" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"

Write-Host "`nData Volumes:" -ForegroundColor Yellow
if (Test-Path "data-dev") {
    $devSize = (Get-ChildItem "data-dev" -Recurse | Measure-Object -Property Length -Sum).Sum
    Write-Host "Development data: data-dev/ ($([math]::Round($devSize/1KB, 2)) KB)" -ForegroundColor Green
} else {
    Write-Host "Development data: data-dev/ (not created)" -ForegroundColor Red
}

if (Test-Path "data-prod") {
    $prodSize = (Get-ChildItem "data-prod" -Recurse | Measure-Object -Property Length -Sum).Sum
    Write-Host "Production data: data-prod/ ($([math]::Round($prodSize/1KB, 2)) KB)" -ForegroundColor Green
} else {
    Write-Host "Production data: data-prod/ (not created)" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
