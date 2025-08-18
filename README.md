# LDP Survey Management App

Status: Step 1 – Admin user journey only (2025-08-18)

This step delivers the admin-only experience:

- Admin login (JWT)
- Admin CRUD for Companies and Employees
- Seeded admin user and sample data

Note: Non-admin journeys (survey creation, distribution, responses, analytics, etc.) are intentionally out of scope for Step 1.

## Tech Stack
- Frontend: React
- Backend: Node.js + Express
- Database: SQLite (for easy local setup)

## Getting Started

### Prerequisites
- Node.js (v18 or above recommended)
- npm (comes with Node.js)

### Run with Docker (recommended)

1. From the project root, build and start:
   - Backend: http://localhost:5000
   - Frontend: http://localhost:3000
2. Login with admin credentials: `admin` / `admin123`.

### Setup (without Docker)

1. **Install backend dependencies:**
   ```
   cd backend
   npm install
   ```
2. **Install frontend dependencies:**
   ```
   cd ../frontend
   npm install
   ```
3. **Run the backend server:**
   ```
   cd ../backend
   npm start
   ```
4. **Run the frontend app:**
   ```
   cd ../frontend
   npm start
   ```

The backend will run on http://localhost:5000 and the frontend on http://localhost:3000 by default.

### Admin Credentials
- Username: `admin`
- Password: `admin123`

## Sample Data
Sample admin user, companies, and employees are preloaded for demo purposes.

## Project Structure
- `backend/` - Express API, SQLite DB, authentication, admin CRUD
- `frontend/` - React app, admin UI, API integration

## Customization
You can modify the sample data and configuration as needed for your use case.

---

For any issues, please refer to the requirements document or contact the project maintainer.
