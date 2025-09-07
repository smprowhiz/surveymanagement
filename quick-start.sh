#!/bin/bash
# Quick Start Script for Survey Management System
# This script opens the VS Code workspace and restores your development environment

echo "🎯 Survey Management System - Quick Start"
echo "=========================================="
echo ""

# Check if VS Code is installed
if ! command -v code &> /dev/null; then
    echo "❌ VS Code not found. Please install Visual Studio Code first."
    exit 1
fi

echo "📂 Opening VS Code workspace..."
echo "   File: SurveyManagement.code-workspace"
echo ""

# Open the workspace file
code "SurveyManagement.code-workspace"

echo "✅ Workspace opened!"
echo ""
echo "🔄 To restore your session:"
echo "   1. VS Code will load with all configured settings"
echo "   2. Use Ctrl+Shift+P → 'Tasks: Run Task' → '🚀 Start Development Environment'"
echo "   3. Read SESSION-RESTORE.md for complete instructions"
echo ""
echo "📊 Your development environment:"
echo "   • Frontend: http://localhost:3001 (dev) / http://localhost:3000 (prod)"
echo "   • Backend:  http://localhost:5001 (dev) / http://localhost:5000 (prod)"
echo "   • GitHub:   https://github.com/smprowhiz/surveymanagement"
echo ""
echo "🎉 Happy coding!"
