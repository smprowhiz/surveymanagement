
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useParams } from 'react-router-dom';
import axios from 'axios';
import CompanyManager from './components/CompanyManager';
import EmployeeManager from './components/EmployeeManager';

const API = 'http://localhost:5000/api';


function Login({ setToken, setRole, setUsernameGlobal }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      <h2>Login</h2>
      <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
      <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
      {error && <div style={{color:'red'}}>{error}</div>}
    </form>
  );
}

function SurveyList({ token }) {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  React.useEffect(() => {
    setLoading(true);
    setError('');
    axios.get(`${API}/surveys`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setSurveys(res.data))
      .catch(() => setError('Failed to load surveys.'))
      .finally(() => setLoading(false));
  }, [token]);
  if (loading) return <div>Loading surveys...</div>;
  if (error) return <div style={{color:'red'}}>{error}</div>;
  if (!surveys.length) return <div>No surveys available.</div>;
  return (
    <div>
      <h2>Surveys</h2>
      <ul>
        {surveys.map(s => <li key={s.id}><Link to={`/survey/${s.id}`}>{s.title}</Link></li>)}
      </ul>
    </div>
  );
}

function SurveyDetail({ token, role }) {
  const { id } = useParams();
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  React.useEffect(() => {
    setLoading(true);
    setError('');
    axios.get(`${API}/surveys/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setSurvey(res.data);
        setAnswers(Array.isArray(res.data.questions) ? res.data.questions.map(q => ({ question_id: q.id, answer: '' })) : []);
      })
      .catch(() => setError('Failed to load survey.'))
      .finally(() => setLoading(false));
  }, [id, token]);
  if (loading) return <div>Loading survey...</div>;
  if (error) return <div style={{color:'red'}}>{error}</div>;
  if (!survey || !Array.isArray(survey.questions)) return <div>No survey found.</div>;
  const handleChange = (i, val) => {
    setAnswers(ans => ans.map((a, idx) => idx === i ? { ...a, answer: val } : a));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/surveys/${id}/response`, { answers }, { headers: { Authorization: `Bearer ${token}` } });
      setSubmitted(true);
    } catch {
      setError('Failed to submit response.');
    }
  };
  return (
    <div>
      <h3>{survey.title}</h3>
      <p>{survey.description}</p>
      {role === 'respondent' && !submitted && (
        <form onSubmit={handleSubmit}>
          {survey.questions.map((q, i) => (
            <div key={q.id}>
              <label>{q.text}</label>
              {q.type === 'rating' ? (
                <input type="number" min="1" max="5" value={answers[i]?.answer} onChange={e => handleChange(i, e.target.value)} />
              ) : (
                <input value={answers[i]?.answer} onChange={e => handleChange(i, e.target.value)} />
              )}
            </div>
          ))}
          <button type="submit">Submit</button>
        </form>
      )}
      {submitted && <div>Thank you for your response!</div>}
    </div>
  );
}

function AdminPanel({ token }) {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
        <button onClick={() => setTab('users')} disabled={tab==='users'}>Users</button>
        <button onClick={() => setTab('companies')} disabled={tab==='companies'}>Companies</button>
        <button onClick={() => setTab('employees')} disabled={tab==='employees'}>Employees</button>
      </div>
      {tab === 'users' && (
        loading ? <div>Loading users...</div> :
        error ? <div style={{color:'red'}}>{error}</div> :
        !users.length ? <div>No users found.</div> :
        <ul>
          {users.map(u => <li key={u.id}>{u.username} ({u.role})</li>)}
        </ul>
      )}
      {tab === 'companies' && <CompanyManager token={token} />}
      {tab === 'employees' && <EmployeeManager token={token} />}
    </div>
  );
}


function App() {
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [username, setUsernameGlobal] = useState('');
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
          token ? (
            role === 'admin' ? <Navigate to="/admin" /> : <SurveyList token={token} />
          ) : <Login setToken={setToken} setRole={setRole} setUsernameGlobal={setUsernameGlobal} />
        } />
        <Route path="/survey/:id" element={token && role !== 'admin' ? <SurveyDetail token={token} role={role} /> : <Navigate to="/" />} />
        <Route path="/admin" element={token && role === 'admin' ? <AdminPanel token={token} /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
