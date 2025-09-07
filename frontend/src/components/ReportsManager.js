import React from 'react';
import axios from 'axios';
import '../App.css';

const API = 'http://localhost:5001/api';

function ReportsList({ token, surveyId, onRefresh, refreshKey }) {
  const [reports, setReports] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (!surveyId) {
      setReports([]);
      return;
    }
    
    setLoading(true);
    setError('');
    axios.get(`${API}/surveys/${surveyId}/reports`, { 
      headers: { Authorization: `Bearer ${token}` } 
    })
      .then(res => setReports(res.data.reports || []))
      .catch(err => setError(err?.response?.data?.error || 'Failed to load reports'))
      .finally(() => setLoading(false));
  }, [token, surveyId, refreshKey]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString();
  };

  const getReportIcon = (format) => {
    switch (format) {
      case 'html': return '🌐';
      case 'docx': return '📄';
      case 'pdf': return '📋';
      default: return '📊';
    }
  };

  const downloadReport = async (filename) => {
    try {
      const response = await axios.get(`${API}/surveys/${surveyId}/reports/${filename}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download report');
    }
  };

  const previewReport = (filename, format) => {
    if (format === 'html') {
      const url = `${API}/surveys/${surveyId}/reports/${filename}`;
      window.open(url + `?token=${token}`, '_blank');
    } else {
      downloadReport(filename);
    }
  };

  if (!surveyId) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--on-surface-variant)' }}>
          <h4>📊 Reports</h4>
          <p>Select a survey to view its reports</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">📊 Available Reports</h3>
        <span style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>
          {reports.length} reports
        </span>
      </div>
      
      {loading ? (
        <div className="loading" style={{ padding: 'var(--space-md)' }}>Loading reports...</div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : reports.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-lg)', color: 'var(--on-surface-variant)' }}>
          No reports generated yet. Generate your first report above.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {reports.map(report => (
            <div 
              key={report.filename} 
              className="card" 
              style={{ margin: 0, background: 'var(--surface-variant)' }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: 'var(--space-md)'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
                    <span style={{ fontSize: '1.2em' }}>{getReportIcon(report.format)}</span>
                    <span style={{ fontWeight: '600', fontSize: '14px' }}>
                      {report.filename}
                    </span>
                    <span style={{ 
                      background: report.format === 'html' ? 'var(--primary-container)' : 'var(--secondary-container)',
                      color: report.format === 'html' ? 'var(--on-primary-container)' : 'var(--on-secondary-container)',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-xs)',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      textTransform: 'uppercase'
                    }}>
                      {report.format}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
                    Created: {formatDate(report.created)} | Size: {formatFileSize(report.size)}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                  {report.format === 'html' && (
                    <button 
                      className="btn btn-outline btn-sm"
                      onClick={() => previewReport(report.filename, report.format)}
                      title="Preview in browser"
                    >
                      👁️ Preview
                    </button>
                  )}
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => downloadReport(report.filename)}
                    title="Download report"
                  >
                    💾 Download
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReportGenerator({ token, surveyId, onReportGenerated }) {
  const [generating, setGenerating] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  const generateReport = async (format) => {
    if (!surveyId) {
      setError('Please select a survey first');
      return;
    }

    setGenerating(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(`${API}/surveys/${surveyId}/reports/generate`, 
        { format }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccess(`${format.toUpperCase()} report generated successfully!`);
      onReportGenerated?.();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">🎯 Generate 360° Report</h3>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem' }}>
          Generate a professional 360-degree feedback report with visual charts and detailed analysis.
        </p>
        
        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-primary"
            onClick={() => generateReport('html')}
            disabled={generating || !surveyId}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}
          >
            🌐 {generating ? 'Generating...' : 'Generate HTML Report'}
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={() => generateReport('docx')}
            disabled={generating || !surveyId}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}
          >
            📄 {generating ? 'Generating...' : 'Generate DOCX Report'}
          </button>
        </div>
        
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        
        {!surveyId && (
          <div className="alert alert-warning">
            Please select a survey from the dropdown above to generate reports.
          </div>
        )}
      </div>
    </div>
  );
}

function SurveySelector({ token, selectedSurveyId, onSurveySelect }) {
  const [surveys, setSurveys] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    setLoading(true);
    setError('');
    axios.get(`${API}/surveys`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setSurveys(res.data))
      .catch(err => setError('Failed to load surveys'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return <div className="loading">Loading surveys...</div>;
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">📋 Select Survey</h3>
      </div>
      
      <div className="form-field">
        <select 
          value={selectedSurveyId || ''} 
          onChange={e => onSurveySelect(e.target.value ? parseInt(e.target.value, 10) : null)}
          style={{ width: '100%' }}
        >
          <option value="">-- Select a survey --</option>
          {surveys.map(survey => (
            <option key={survey.id} value={survey.id}>
              {survey.title} (ID: {survey.id}) - {survey.status}
            </option>
          ))}
        </select>
      </div>
      
      {selectedSurveyId && (
        <div style={{ 
          marginTop: 'var(--space-sm)', 
          padding: 'var(--space-sm)', 
          background: 'var(--primary-container)',
          color: 'var(--on-primary-container)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.875rem'
        }}>
          ✓ Selected: {surveys.find(s => s.id === selectedSurveyId)?.title || 'Unknown Survey'}
        </div>
      )}
    </div>
  );
}

export default function ReportsManager({ token }) {
  const [selectedSurveyId, setSelectedSurveyId] = React.useState(null);
  const [refreshReports, setRefreshReports] = React.useState(0);

  const handleReportGenerated = () => {
    setRefreshReports(prev => prev + 1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      <div className="page-header">
        <h2 className="page-title">📊 360° Feedback Reports</h2>
        <p className="page-subtitle">Generate and manage professional 360-degree feedback reports</p>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: 'var(--space-lg)',
        alignItems: 'start'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <SurveySelector 
            token={token} 
            selectedSurveyId={selectedSurveyId}
            onSurveySelect={setSelectedSurveyId}
          />
          
          <ReportGenerator 
            token={token} 
            surveyId={selectedSurveyId}
            onReportGenerated={handleReportGenerated}
          />
        </div>
        
        <ReportsList 
          token={token} 
          surveyId={selectedSurveyId}
          refreshKey={refreshReports}
        />
      </div>
    </div>
  );
}
