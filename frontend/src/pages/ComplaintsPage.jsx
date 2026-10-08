import React, { useState, useEffect } from 'react';

const CATEGORY_ICONS = {
  'Electrical': '⚡',
  'Plumbing & Water': '🚰',
  'Plumbing': '🚰',
  'Wi-Fi & Internet': '📶',
  'Furniture & Carpentry': '🪑',
  'Housekeeping & Cleanliness': '🧹',
};

export default function ComplaintsPage({ apiBaseUrl, user, onNavigateToNew }) {
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  // Fetch complaints
  const fetchComplaints = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiBaseUrl}/complaints?userId=${user.id}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load complaints.');
      }
      setComplaints(data.complaints || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [user.id]);

  // Update status of a complaint
  const handleUpdateStatus = async (complaintId, nextStatus) => {
    setUpdatingId(complaintId);
    try {
      const res = await fetch(`${apiBaseUrl}/complaints/${complaintId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update status.');
      }
      // Update local state
      setComplaints((prev) =>
        prev.map((c) => (c.id === complaintId ? { ...c, status: nextStatus } : c))
      );
    } catch (err) {
      alert(`Error updating status: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter complaints list
  const filteredComplaints = complaints.filter((c) => {
    if (filter === 'All') return true;
    return c.status.toLowerCase() === filter.toLowerCase();
  });

  const getStatusClass = (status) => {
    switch (status) {
      case 'Pending':
        return 'status-pending';
      case 'In Progress':
        return 'status-in-progress';
      case 'Resolved':
        return 'status-resolved';
      default:
        return 'status-pending';
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Hostel Complaints</h1>
          <p className="page-desc">Track resolution progress for your room and facilities</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onNavigateToNew}
        >
          ➕ Lodge New Complaint
        </button>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        {['All', 'Pending', 'In Progress', 'Resolved'].map((tab) => (
          <button
            key={tab}
            type="button"
            className="btn"
            style={{
              padding: '0.4rem 0.9rem',
              fontSize: '0.825rem',
              borderRadius: '20px',
              border: '1px solid var(--border-subtle)',
              background: filter === tab ? 'var(--primary)' : '#ffffff',
              color: filter === tab ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 600,
            }}
            onClick={() => setFilter(tab)}
          >
            {tab} (
            {tab === 'All'
              ? complaints.length
              : complaints.filter((c) => c.status.toLowerCase() === tab.toLowerCase()).length}
            )
          </button>
        ))}
      </div>

      {error && (
        <div className="alert alert-error">
          <span>⚠️ {error}</span>
          <button
            type="button"
            style={{ fontWeight: 600, textDecoration: 'underline' }}
            onClick={fetchComplaints}
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading your complaints...
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🛌</div>
          <h3 className="empty-title">
            {filter === 'All' ? 'No complaints logged yet' : `No ${filter} complaints`}
          </h3>
          <p className="empty-text">
            Everything seems to be running smoothly! If you are facing any maintenance issues, file a new complaint.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onNavigateToNew}
          >
            Lodge a Complaint
          </button>
        </div>
      ) : (
        <div className="complaints-list">
          {filteredComplaints.map((item) => (
            <div key={item.id} className="complaint-card">
              <div className="complaint-top">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div className="complaint-title-group">
                    <span className="complaint-cat-badge">
                      <span>{CATEGORY_ICONS[item.category] || '📌'}</span>
                      <span>{item.category}</span>
                    </span>
                    <span className="complaint-cat-badge" style={{ background: '#f8fafc' }}>
                      🚪 Room {item.room_number}
                    </span>
                  </div>
                  <h3 className="complaint-title">{item.title}</h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span className={`status-badge ${getStatusClass(item.status)}`}>
                    ● {item.status}
                  </span>
                </div>
              </div>

              <p className="complaint-desc">{item.description}</p>

              <div className="complaint-footer">
                <div className="complaint-meta">
                  <span>📅 {new Date(item.created_at).toLocaleDateString()}</span>
                  <span>🕒 {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {/* Quick Status Action */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label htmlFor={`status-${item.id}`} style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Update Status:
                  </label>
                  <select
                    id={`status-${item.id}`}
                    className="status-select-btn"
                    value={item.status}
                    disabled={updatingId === item.id}
                    onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
