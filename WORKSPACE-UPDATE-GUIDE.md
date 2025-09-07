# 🔄 Workspace Update & Maintenance Guide

## 📋 **QUICK ANSWER: How Updates Work**

**🎯 SHORT VERSION**: Most things are automatic! You only need to manually commit your code changes and restart Docker containers when needed.

**✅ AUTOMATIC** (Happens every time you open the workspace):
- All VS Code settings, tasks, and debug configurations
- Your folder structure and layout
- Terminal preferences and color themes  
- Extension recommendations
- Git repository connection

**🔧 MANUAL** (You control when):
- Committing your code changes to Git/GitHub
- Starting/stopping Docker development environment
- Installing new dependencies or VS Code extensions

## Detailed Breakdown

### ✅ Automatic (No Action Needed)
- VS Code settings and tasks load automatically
- Folder structure and workspace layout preserved
- Git repository state maintained
- Terminal preferences restored
- Extension recommendations appear

### 🖐️ Manual Actions Required

#### 1. **Session Startup** (Do this each time)
```powershell
# Method 1: Use the quick-start script
.\quick-start.ps1

# Method 2: Manual steps
code SurveyManagement.code-workspace
# Then use Ctrl+Shift+P → "Tasks: Run Task" → "🚀 Start Development Environment"
```

#### 2. **Daily Development Updates**
```powershell
# Save your work
git add .
git commit -m "Your changes description"
git push origin main

# Update workspace file (if needed)
# Edit SurveyManagement.code-workspace manually
```

#### 3. **Weekly Maintenance**
```powershell
# Backup database
.\scripts\backup-database.ps1

# Update dependencies
docker exec surveyproject-backend-dev npm update
docker exec surveyproject-frontend-dev npm update

# Commit updates
git add .
git commit -m "Weekly maintenance: dependency updates"
git push origin main
```

## 🔧 Adding New Workspace Features

### Adding New Tasks
Edit `.vscode/tasks.json`:
```json
{
  "label": "🆕 Your New Task",
  "type": "shell",
  "command": "your-command",
  "group": "build"
}
```

### Adding New Debug Configurations  
Edit `.vscode/launch.json`:
```json
{
  "name": "🐛 Debug New Feature",
  "type": "node",
  "request": "launch",
  "program": "${workspaceFolder}/your-script.js"
}
```

### Updating Settings
Edit `.vscode/settings.json` or `SurveyManagement.code-workspace`

## 📱 Smart Update Notifications

### Create an Update Reminder Task
Add this to `.vscode/tasks.json`:
```json
{
  "label": "🔔 Check for Updates",
  "type": "shell",
  "command": "powershell",
  "args": [
    "-Command", 
    "Write-Host 'Checking for updates...' -ForegroundColor Yellow; git fetch origin; git status; docker images --format 'table {{.Repository}}\t{{.Tag}}\t{{.CreatedAt}}'"
  ],
  "group": "build"
}
```

## 🎯 Best Practices

### 1. **Always Use the Workspace File**
- Don't open individual folders
- Use `SurveyManagement.code-workspace` for consistent experience

### 2. **Regular Commits**
- Commit workspace changes along with code changes
- Use descriptive commit messages

### 3. **Keep Documentation Updated**
- Update `SESSION-RESTORE.md` when adding major features
- Update `README.md` for deployment changes

### 4. **Sync Regularly**
```powershell
# Quick sync command
git add . && git commit -m "Session save: $(Get-Date -Format 'yyyy-MM-dd HH:mm')" && git push origin main
```

## 🔄 Auto-Update Scripts (Optional)

You can create automated update scripts for routine tasks.

### Auto-Commit Script
```powershell
# auto-save.ps1
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
git add .
git commit -m "Auto-save: $timestamp"
git push origin main
Write-Host "✅ Auto-saved to GitHub" -ForegroundColor Green
```

### Scheduled Backup
```powershell
# Use Windows Task Scheduler to run this daily
Copy-Item ".\data-dev\survey.db" ".\backups\survey-$(Get-Date -Format 'yyyyMMdd').db"
```

## 🚨 Emergency Recovery

If workspace gets corrupted:
1. Clone from GitHub: `git clone https://github.com/smprowhiz/surveymanagement.git`
2. Copy your local database: `data-dev/survey.db`
3. Open workspace: `code SurveyManagement.code-workspace`
4. Read `SESSION-RESTORE.md` for complete restoration

---

**Remember**: The workspace configuration is preserved, but your active development session (running containers, open files, etc.) needs to be manually restored each time you start VS Code.
