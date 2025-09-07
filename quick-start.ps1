# Quick Start Script for Survey Management System
# PowerShell version for Windows

Write-Host "🎯 Survey Management System - Quick Start" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if VS Code is installed
try {
    Get-Command code -ErrorAction Stop | Out-Null
    Write-Host "✅ VS Code found!" -ForegroundColor Green
} catch {
    Write-Host "❌ VS Code not found. Please install Visual Studio Code first." -ForegroundColor Red
    Write-Host "   Download from: https://code.visualstudio.com/" -ForegroundColor Yellow
    exit 1
}

Write-Host "📂 Opening VS Code workspace..." -ForegroundColor Yellow
Write-Host "   File: SurveyManagement.code-workspace" -ForegroundColor Gray
Write-Host ""

# Open the workspace file
Start-Process "code" -ArgumentList "SurveyManagement.code-workspace"

Write-Host "✅ Workspace opened!" -ForegroundColor Green
Write-Host ""
Write-Host "🔄 To restore your session:" -ForegroundColor Cyan
Write-Host "   1. VS Code will load with all configured settings" -ForegroundColor White
Write-Host "   2. Use Ctrl+Shift+P → 'Tasks: Run Task' → '🚀 Start Development Environment'" -ForegroundColor White
Write-Host "   3. Read SESSION-RESTORE.md for complete instructions" -ForegroundColor White
Write-Host ""
Write-Host "📊 Your development environment:" -ForegroundColor Cyan
Write-Host "   • Frontend: http://localhost:3001 (dev) / http://localhost:3000 (prod)" -ForegroundColor White
Write-Host "   • Backend:  http://localhost:5001 (dev) / http://localhost:5000 (prod)" -ForegroundColor White
Write-Host "   • GitHub:   https://github.com/smprowhiz/surveymanagement" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Happy coding!" -ForegroundColor Green

# Optional: Start development environment automatically
$startDev = Read-Host "Would you like to start the development environment now? (y/N)"
if ($startDev -eq "y" -or $startDev -eq "Y") {
    Write-Host ""
    Write-Host "🚀 Starting development environment..." -ForegroundColor Yellow
    & .\start-dev.ps1
}
