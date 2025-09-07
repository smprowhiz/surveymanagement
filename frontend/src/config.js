// Configuration for API endpoints
const config = {
  API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5001',
  API_ENDPOINTS: {
    AUTH: '/api/auth',
    SURVEYS: '/api/surveys',
    RESPONSES: '/api/responses',
    REPORTS: '/api/reports',
    ADMIN: '/api/admin'
  }
};

export default config;
