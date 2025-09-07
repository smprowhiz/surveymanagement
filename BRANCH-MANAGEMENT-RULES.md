# 🚨 CRITICAL BRANCH MANAGEMENT RULES

## ⚠️ **NEVER DELETE BRANCHES WITHOUT EXPLICIT USER APPROVAL**

### 📋 **Mandatory Rules for AI Assistant:**

1. **NO AUTOMATIC BRANCH DELETION**
   - Never delete any git branch automatically
   - Never suggest branch deletion without explicit user request
   - Always preserve branches even after merging

2. **POST-COMMIT/MERGE PROTOCOL**
   - After committing changes to any branch: **KEEP THE BRANCH**
   - After merging to main: **KEEP THE SOURCE BRANCH**
   - Always ask user explicitly before any deletion: "Do you want me to delete branch [name]?"

3. **BRANCH PRESERVATION PRIORITY**
   - Production branches (like `Reporting`) are CRITICAL - never touch
   - Feature branches may contain work-in-progress
   - Development branches may be referenced later
   - User may want to return to previous versions

4. **EXPLICIT APPROVAL REQUIRED**
   - User must explicitly say "delete branch X" or "remove branch Y"
   - General statements like "clean up" or "merge it" do NOT authorize deletion
   - When in doubt: **PRESERVE THE BRANCH**

## 🎯 **Current Branch Strategy**
- **`main`**: Enhanced development code (ports 3001/5001) - primary development branch
- **`survey-enhancements`**: Active feature development (ports 3001/5001) - current working branch
- **`Reporting`**: Production code (ports 3000/5000) - stable production branch
- **Any future branches**: Preserve unless explicitly told to delete

## 📝 **Safe Commands to Use**
✅ `git checkout [branch]` - Switch branches
✅ `git merge [branch]` - Merge branches  
✅ `git commit` - Commit changes
✅ `git push` - Push to remote

❌ `git branch -d [branch]` - DELETE (requires explicit approval)
❌ `git branch -D [branch]` - FORCE DELETE (requires explicit approval)

---

**🔒 RULE SUMMARY: PRESERVE ALL BRANCHES UNLESS USER EXPLICITLY REQUESTS DELETION**
