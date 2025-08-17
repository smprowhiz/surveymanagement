# LDP Survey Management App

This project is a full-stack web application for managing surveys, as described in the LDP Survey Management App requirements document. It includes:

- User authentication (Admin, Survey Creator, Respondent roles)
- Survey creation and management
- Survey distribution
- Response collection
- Reporting and analytics
- Admin management
- Sample data for demonstration

## Tech Stack
- Frontend: React
- Backend: Node.js + Express
- Database: SQLite (for easy local setup)

## Getting Started

### Prerequisites
- Node.js (v18 or above recommended)
- npm (comes with Node.js)

### Setup

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

## Sample Data
Sample users, surveys, and responses are preloaded for demo purposes.

## Project Structure
- `backend/` - Express API, SQLite DB, authentication, business logic
- `frontend/` - React app, UI components, API integration

## Customization
You can modify the sample data and configuration as needed for your use case.

---

For any issues, please refer to the requirements document or contact the project maintainer.
