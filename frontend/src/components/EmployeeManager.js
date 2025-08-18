import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../App.css';

const API = 'http://localhost:5000/api';

export default function EmployeeManager({ token }) {
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAll = () => {
    setLoading(true);
    setError('');
    // Fetch employees and companies in parallel
    Promise.all([
      axios.get(`${API}/employees`, { headers: { Authorization: `Bearer ${token}` } }).catch(err => { throw new Error('Failed to load employees: ' + (err.response?.data?.error || err.message)); }),
      axios.get(`${API}/companies`, { headers: { Authorization: `Bearer ${token}` } }).catch(err => { throw new Error('Failed to load companies: ' + (err.response?.data?.error || err.message)); })
    ])
      .then(([empRes, compRes]) => {
        setEmployees(empRes.data);
        setCompanies(compRes.data);
      })
      .catch((err) => setError(err.message || 'Failed to load employees or companies.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, [token]);

  const handleAdd = e => {
    e.preventDefault();
    setError('');
    axios.post(`${API}/employees`, { name, email, role, company_id: companyId }, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => { setName(''); setEmail(''); setRole(''); setCompanyId(''); fetchAll(); })
      .catch(() => setError('Failed to add employee.'));
  };

  const handleEdit = emp => {
    setEditing(emp);
    setName(emp.name || '');
    setEmail(emp.email || '');
    setRole(emp.role || '');
    setCompanyId(emp.company_id || '');
  };

  const handleUpdate = e => {
    e.preventDefault();
    setError('');
    axios.put(`${API}/employees/${editing.id}`, { name, email, role, company_id: companyId }, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => { setEditing(null); setName(''); setEmail(''); setRole(''); setCompanyId(''); fetchAll(); })
      .catch(() => setError('Failed to update employee.'));
  };

  const handleDelete = id => {
    if (!window.confirm('Delete this employee?')) return;
    setError('');
    axios.delete(`${API}/employees/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(fetchAll)
      .catch(() => setError('Failed to delete employee.'));
  };

  if (loading) return <div>Loading employees...</div>;
  return (
    <div className="app-container">
      <h3>Employees</h3>
      <form onSubmit={editing ? handleUpdate : handleAdd}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Employee name" required />
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required type="email" />
        <input value={role} onChange={e => setRole(e.target.value)} placeholder="Role" required />
        <select value={companyId} onChange={e => setCompanyId(e.target.value)} required>
          <option value="">Select company</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button type="submit">{editing ? 'Update' : 'Add'}</button>
        {editing && <button type="button" onClick={() => { setEditing(null); setName(''); setEmail(''); setRole(''); setCompanyId(''); }}>Cancel</button>}
      </form>
      {error && <div className="error">{error}</div>}
      <ul className="card-list">
        {employees.map(emp => (
          <li className="card" key={emp.id}>
            <div className="card-title">{emp.name}</div>
            <div className="card-details">{emp.email} | {emp.role}</div>
            <div className="card-details">Company: {companies.find(c => c.id === emp.company_id)?.name || 'N/A'}</div>
            <div className="card-actions">
              <button onClick={() => handleEdit(emp)}>Edit</button>
              <button onClick={() => handleDelete(emp.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
