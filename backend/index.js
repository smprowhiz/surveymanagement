const SECRET = 'your-very-secret-key';
const PORT = 5000;

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Initialize SQLite DB (persistent)
const db = new sqlite3.Database('survey.db');

const app = express();
app.use(cors());
app.use(express.json());

// Create tables and insert sample data (including companies and employees)
function initDb() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      address TEXT,
      contact_email TEXT,
      created_at TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER,
      name TEXT,
      email TEXT,
      role TEXT,
      created_at TEXT
    )`);
    // Sample users
    const hash = bcrypt.hashSync('admin123', 8);
    db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES ('admin', ?, 'admin')`, [hash]);
    // Sample companies
    db.run(`INSERT OR IGNORE INTO companies (id, name, address, contact_email, created_at) VALUES (1, 'Acme Corp', '123 Main St', 'info@acme.com', ?)`, [new Date().toISOString()]);
    db.run(`INSERT OR IGNORE INTO companies (id, name, address, contact_email, created_at) VALUES (2, 'Globex Inc', '456 Market Ave', 'contact@globex.com', ?)`, [new Date().toISOString()]);
    // Sample employees (ensure at least 1 for each company)
    db.run(`INSERT OR IGNORE INTO employees (id, company_id, name, email, role, created_at) VALUES (1, 1, 'Alice Smith', 'alice@acme.com', 'manager', ?)`, [new Date().toISOString()]);
    db.run(`INSERT OR IGNORE INTO employees (id, company_id, name, email, role, created_at) VALUES (2, 1, 'Bob Jones', 'bob@acme.com', 'employee', ?)`, [new Date().toISOString()]);
    db.run(`INSERT OR IGNORE INTO employees (id, company_id, name, email, role, created_at) VALUES (3, 2, 'Carol Lee', 'carol@globex.com', 'manager', ?)`, [new Date().toISOString()]);
    db.run(`INSERT OR IGNORE INTO employees (id, company_id, name, email, role, created_at) VALUES (4, 2, 'David Kim', 'david@globex.com', 'engineer', ?)`, [new Date().toISOString()]);
  });
}
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
// List all employees (needed for EmployeeManager)
app.get('/api/employees', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  db.all('SELECT * FROM employees', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
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
  const { name, email, role, company_id } = req.body;
  db.run('UPDATE employees SET name = ?, email = ?, role = ?, company_id = ? WHERE id = ?', [name, email, role, company_id, req.params.id], function(err) {
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


app.get('/api/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  db.all('SELECT id, username, role FROM users', [], (err, users) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(users);
  });
});

// TEMP: Debug endpoint to check table data
app.get('/api/debug-tables', (req, res) => {
  db.serialize(() => {
    const result = {};
    db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
      result.users = row ? row.count : 0;
      db.get('SELECT COUNT(*) as count FROM companies', (err2, row2) => {
        result.companies = row2 ? row2.count : 0;
        db.get('SELECT COUNT(*) as count FROM employees', (err3, row3) => {
          result.employees = row3 ? row3.count : 0;
          res.json(result);
        });
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
