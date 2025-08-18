
import React from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import CompanyManager from './components/CompanyManager';
import EmployeeManager from './components/EmployeeManager';

const API = 'http://localhost:5000/api';

function Login({ setToken, setRole, setUsernameGlobal }) {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API}/login`, { username, password });
      setToken(res.data.token);
      setRole(res.data.role);
      setUsernameGlobal(username);
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <h2>Admin Login</h2>
      <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
      <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
      {error && <div style={{color:'red'}}>{error}</div>}
    </form>
  );
}

function AdminPanel({ token }) {
  const [tab, setTab] = React.useState('companies');
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (tab === 'users') {
      setLoading(true);
      setError('');
      axios.get(`${API}/users`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setUsers(res.data))
        .catch(() => setError('Failed to load users.'))
        .finally(() => setLoading(false));
    }
  }, [token, tab]);

  return (
    <div>
      <h2>Admin Panel</h2>
      <div style={{marginBottom:16}}>
        <button onClick={() => setTab('companies')} disabled={tab==='companies'}>Companies</button>
        <button onClick={() => setTab('employees')} disabled={tab==='employees'}>Employees</button>
        <button onClick={() => setTab('users')} disabled={tab==='users'}>Users</button>
      </div>
      {tab === 'users' && (
        <div>
          {loading ? (
            <div>Loading users...</div>
          ) : error ? (
            <div style={{color:'red'}}>{error}</div>
          ) : (
            <ul>
              {users.map(u => (
                <li key={u.id}>{u.username} ({u.role})</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {tab === 'companies' && <CompanyManager token={token} />}
      {tab === 'employees' && <EmployeeManager token={token} />}
    </div>
  );
}

function App() {
  const [token, setToken] = React.useState(null);
  const [role, setRole] = React.useState(null);
  const [username, setUsernameGlobal] = React.useState('');

  return (
    <Router>
      <nav style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <div>
          <Link to="/">Home</Link>
          {token && role === 'admin' && <Link to="/admin" style={{marginLeft:8}}>Admin Panel</Link>}
        </div>
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          {token && <span style={{fontWeight:'bold', color:'#333'}}>User: {username}</span>}
          {token && <button onClick={() => { setToken(null); setRole(null); setUsernameGlobal(''); }}>Logout</button>}
        </div>
      </nav>
      <Routes>
        <Route path="/" element={
          token && role === 'admin'
            ? <Navigate to="/admin" />
            : <Login setToken={setToken} setRole={setRole} setUsernameGlobal={setUsernameGlobal} />
        } />
        <Route path="/admin" element={token && role === 'admin' ? <AdminPanel token={token} /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
