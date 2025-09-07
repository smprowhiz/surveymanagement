# Development Workflow

## Environment Separation

### Production Environment (PROTECTED)
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **Containers**: surveyproject-frontend-1, surveyproject-backend-1
- **Status**: Running and preserved - DO NOT MODIFY

### Development Environment
- **Frontend**: http://localhost:3001
- **Backend**: http://localhost:5001
- **Containers**: surveyproject-frontend-dev, surveyproject-backend-dev
- **Usage**: For all new development work

## Quick Commands

### Start Development Environment
`powershell
docker-compose -f docker-compose.dev.yml up --build -d
`

### Check Status
`powershell
# Production (3000/5000)
docker-compose ps

# Development (3001/5001)
docker-compose -f docker-compose.dev.yml ps
`

### Stop Development Environment
`powershell
docker-compose -f docker-compose.dev.yml down
`

## Safety Rules
1.  Always use docker-compose.dev.yml for development
2.  Never run docker-compose down without -f docker-compose.dev.yml
3.  Production containers on 3000/5000 remain untouched
4.  All new work happens on 3001/5001

