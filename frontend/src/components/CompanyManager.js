import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../App.css';

const API = 'http://localhost:5000/api';

export default function CompanyManager({ token }) {
  const [companies, setCompanies] = useState([]);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCompanies = () => {
    setLoading(true);
    setError('');
    axios.get(`${API}/companies`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setCompanies(res.data))
      .catch(() => setError('Failed to load companies.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCompanies(); }, [token]);

  const handleAdd = e => {
    e.preventDefault();
    setError('');
    axios.post(`${API}/companies`, { name, address, contact_email: contactEmail }, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => { setName(''); setAddress(''); setContactEmail(''); fetchCompanies(); })
      .catch(() => setError('Failed to add company.'));
  };

  const handleEdit = c => {
    setEditing(c);
    setName(c.name || '');
    setAddress(c.address || '');
    setContactEmail(c.contact_email || '');
  };

  const handleUpdate = e => {
    e.preventDefault();
    setError('');
    axios.put(`${API}/companies/${editing.id}`, { name, address, contact_email: contactEmail }, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => { setEditing(null); setName(''); setAddress(''); setContactEmail(''); fetchCompanies(); })
      .catch(() => setError('Failed to update company.'));
  };

  const handleDelete = id => {
    if (!window.confirm('Delete this company?')) return;
    setError('');
    axios.delete(`${API}/companies/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(fetchCompanies)
      .catch(() => setError('Failed to delete company.'));
  };

  if (loading) return <div>Loading companies...</div>;
  return (
    <div className="app-container">
      <h3>Companies</h3>
      <form onSubmit={editing ? handleUpdate : handleAdd}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Company name" required />
        <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Address" required />
        <input value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="Contact Email" required type="email" />
        <button type="submit">{editing ? 'Update' : 'Add'}</button>
        {editing && <button type="button" onClick={() => { setEditing(null); setName(''); setAddress(''); setContactEmail(''); }}>Cancel</button>}
      </form>
      {error && <div className="error">{error}</div>}
      <ul className="card-list">
        {companies.map(c => (
          <li className="card" key={c.id}>
            <div className="card-title">{c.name}</div>
            <div className="card-details">{c.address}</div>
            <div className="card-details">{c.contact_email}</div>
            <div className="card-actions">
              <button onClick={() => handleEdit(c)}>Edit</button>
              <button onClick={() => handleDelete(c.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
