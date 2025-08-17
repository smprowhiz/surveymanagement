const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 5000;
const SECRET = 'ldp_survey_secret';

app.use(cors());
app.use(express.json());

// --- Users CRUD (admin only) ---
app.get('/api/users/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  db.get('SELECT id, username, role FROM users WHERE id = ?', [req.params.id], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  });
});
// Create user (admin only)
app.post('/api/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { username, password, role } = req.body;
  const hash = bcrypt.hashSync(password, 8);
  db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hash, role], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});
// Update user (admin only)
app.put('/api/users/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { username, password, role } = req.body;
  const hash = password ? bcrypt.hashSync(password, 8) : undefined;
  let query = 'UPDATE users SET ';
  let params = [];
  if (username) { query += 'username = ?, '; params.push(username); }
  if (hash) { query += 'password = ?, '; params.push(hash); }
  if (role) { query += 'role = ?, '; params.push(role); }
  query = query.replace(/, $/, '');
  query += ' WHERE id = ?';
  params.push(req.params.id);
  db.run(query, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
});
// Delete user (admin only)
app.delete('/api/users/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  db.run('DELETE FROM users WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// --- Questions CRUD (admin only) ---
app.get('/api/questions', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  db.all('SELECT * FROM questions', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
app.get('/api/questions/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  db.get('SELECT * FROM questions WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Question not found' });
    res.json(row);
  });
});
app.post('/api/questions', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { survey_id, text, type } = req.body;
  db.run('INSERT INTO questions (survey_id, text, type) VALUES (?, ?, ?)', [survey_id, text, type], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});
app.put('/api/questions/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { text, type } = req.body;
  db.run('UPDATE questions SET text = ?, type = ? WHERE id = ?', [text, type, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
});
app.delete('/api/questions/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  db.run('DELETE FROM questions WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// --- Responses CRUD (admin only) ---
app.get('/api/responses', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  db.all('SELECT * FROM responses', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
app.get('/api/responses/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  db.get('SELECT * FROM responses WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Response not found' });
    res.json(row);
  });
});
app.delete('/api/responses/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  db.run('DELETE FROM responses WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// --- Answers CRUD (admin only) ---
app.get('/api/answers', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  db.all('SELECT * FROM answers', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
app.get('/api/answers/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  db.get('SELECT * FROM answers WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Answer not found' });
    res.json(row);
  });
});
app.delete('/api/answers/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  db.run('DELETE FROM answers WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});
// --- Employees: Get all employees (admin only) ---
app.get('/api/employees', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  db.all('SELECT * FROM employees', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});


// Initialize SQLite DB (persistent)
const db = new sqlite3.Database('survey.db');


// Create tables and insert sample data (including companies and employees)
function initDb() {
  db.serialize(() => {
    db.run(`CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT
    )`);
    db.run(`CREATE TABLE companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      address TEXT,
      contact_email TEXT,
      created_at TEXT
    )`);
    db.run(`CREATE TABLE employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER,
      name TEXT,
      email TEXT,
      role TEXT,
      created_at TEXT
    )`);
    db.run(`CREATE TABLE surveys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      description TEXT,
      creator_id INTEGER
    )`);
    db.run(`CREATE TABLE questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      survey_id INTEGER,
      text TEXT,
      type TEXT
    )`);
    db.run(`CREATE TABLE responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      survey_id INTEGER,
      user_id INTEGER,
      submitted_at TEXT
    )`);
    db.run(`CREATE TABLE answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      response_id INTEGER,
      question_id INTEGER,
      answer TEXT
    )`);
    // Sample users
    const hash = bcrypt.hashSync('admin123', 8);
    db.run(`INSERT INTO users (username, password, role) VALUES ('admin', ?, 'admin')`, [hash]);
    db.run(`INSERT INTO users (username, password, role) VALUES ('creator', ?, 'creator')`, [hash]);
    db.run(`INSERT INTO users (username, password, role) VALUES ('user1', ?, 'respondent')`, [hash]);
    // Sample companies
    db.run(`INSERT INTO companies (name, address, contact_email, created_at) VALUES ('Acme Corp', '123 Main St', 'info@acme.com', ?)`, [new Date().toISOString()]);
    db.run(`INSERT INTO companies (name, address, contact_email, created_at) VALUES ('Globex Inc', '456 Market Ave', 'contact@globex.com', ?)`, [new Date().toISOString()]);
  // Sample employees (ensure at least 1 for each company)
  db.run(`INSERT INTO employees (company_id, name, email, role, created_at) VALUES (1, 'Alice Smith', 'alice@acme.com', 'manager', ?)`, [new Date().toISOString()]);
  db.run(`INSERT INTO employees (company_id, name, email, role, created_at) VALUES (1, 'Bob Jones', 'bob@acme.com', 'employee', ?)`, [new Date().toISOString()]);
  db.run(`INSERT INTO employees (company_id, name, email, role, created_at) VALUES (2, 'Carol Lee', 'carol@globex.com', 'manager', ?)`, [new Date().toISOString()]);
  db.run(`INSERT INTO employees (company_id, name, email, role, created_at) VALUES (2, 'David Kim', 'david@globex.com', 'engineer', ?)`, [new Date().toISOString()]);
    // Sample survey
    db.run(`INSERT INTO surveys (title, description, creator_id) VALUES ('Employee Feedback', 'Quarterly feedback survey', 2)`);
    db.run(`INSERT INTO questions (survey_id, text, type) VALUES (1, 'How satisfied are you with your job?', 'rating')`);
    db.run(`INSERT INTO questions (survey_id, text, type) VALUES (1, 'What can be improved?', 'text')`);
  });
}
// --- Companies CRUD ---
app.get('/api/companies', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  db.all('SELECT * FROM companies', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/companies', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { name, address, contact_email } = req.body;
  db.run('INSERT INTO companies (name, address, contact_email, created_at) VALUES (?, ?, ?, ?)', [name, address, contact_email, new Date().toISOString()], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

app.get('/api/companies/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  db.get('SELECT * FROM companies WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Company not found' });
    res.json(row);
  });
});

app.put('/api/companies/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { name, address, contact_email } = req.body;
  db.run('UPDATE companies SET name = ?, address = ?, contact_email = ? WHERE id = ?', [name, address, contact_email, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
});

app.delete('/api/companies/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  db.run('DELETE FROM companies WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});


// --- Employees CRUD ---
app.get('/api/companies/:companyId/employees', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  db.all('SELECT * FROM employees WHERE company_id = ?', [req.params.companyId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add POST /api/employees endpoint for frontend compatibility
app.post('/api/employees', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { name, email, role, company_id } = req.body;
  if (!name || !email || !role || !company_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  db.run('INSERT INTO employees (company_id, name, email, role, created_at) VALUES (?, ?, ?, ?, ?)', [company_id, name, email, role, new Date().toISOString()], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

app.post('/api/companies/:companyId/employees', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { name, email, role } = req.body;
  db.run('INSERT INTO employees (company_id, name, email, role, created_at) VALUES (?, ?, ?, ?, ?)', [req.params.companyId, name, email, role, new Date().toISOString()], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

app.get('/api/employees/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  db.get('SELECT * FROM employees WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Employee not found' });
    res.json(row);
  });
});

app.put('/api/employees/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { name, email, role } = req.body;
  db.run('UPDATE employees SET name = ?, email = ?, role = ? WHERE id = ?', [name, email, role, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
});

app.delete('/api/employees/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  db.run('DELETE FROM employees WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

initDb();

// Auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Routes
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err || !user) return res.status(401).json({ message: 'Invalid credentials' });
    if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET, { expiresIn: '1h' });
    res.json({ token, role: user.role });
  });
});

app.get('/api/surveys', authenticateToken, (req, res) => {
  db.all('SELECT * FROM surveys', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/surveys/:id', authenticateToken, (req, res) => {
  const surveyId = req.params.id;
  db.get('SELECT * FROM surveys WHERE id = ?', [surveyId], (err, survey) => {
    if (err || !survey) return res.status(404).json({ error: 'Survey not found' });
    db.all('SELECT * FROM questions WHERE survey_id = ?', [surveyId], (err, questions) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ...survey, questions });
    });
  });
});

app.post('/api/surveys', authenticateToken, (req, res) => {
  if (req.user.role !== 'creator' && req.user.role !== 'admin') return res.sendStatus(403);
  const { title, description, questions } = req.body;
  db.run('INSERT INTO surveys (title, description, creator_id) VALUES (?, ?, ?)', [title, description, req.user.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    const surveyId = this.lastID;
    const stmt = db.prepare('INSERT INTO questions (survey_id, text, type) VALUES (?, ?, ?)');
    questions.forEach(q => stmt.run(surveyId, q.text, q.type));
    stmt.finalize();
    res.json({ id: surveyId });
  });
});

app.post('/api/surveys/:id/response', authenticateToken, (req, res) => {
  const surveyId = req.params.id;
  const { answers } = req.body;
  db.run('INSERT INTO responses (survey_id, user_id, submitted_at) VALUES (?, ?, ?)', [surveyId, req.user.id, new Date().toISOString()], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    const responseId = this.lastID;
    const stmt = db.prepare('INSERT INTO answers (response_id, question_id, answer) VALUES (?, ?, ?)');
    answers.forEach(a => stmt.run(responseId, a.question_id, a.answer));
    stmt.finalize();
    res.json({ id: responseId });
  });
});

app.get('/api/surveys/:id/responses', authenticateToken, (req, res) => {
  if (req.user.role !== 'creator' && req.user.role !== 'admin') return res.sendStatus(403);
  const surveyId = req.params.id;
  db.all('SELECT * FROM responses WHERE survey_id = ?', [surveyId], (err, responses) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(responses);
  });
});

app.get('/api/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  db.all('SELECT id, username, role FROM users', [], (err, users) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(users);
  });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
