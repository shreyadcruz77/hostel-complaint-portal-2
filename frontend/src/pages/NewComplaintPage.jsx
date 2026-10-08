import React, { useState } from 'react';

const CATEGORIES = [
  { id: 'cat_1', name: 'Electrical', icon: '⚡', desc: 'Lights, fans, switches, wiring' },
  { id: 'cat_2', name: 'Plumbing & Water', icon: '🚰', desc: 'Taps, leakage, geyser, flush' },
  { id: 'cat_3', name: 'Wi-Fi & Internet', icon: '📶', desc: 'No connection, low speed' },
  { id: 'cat_4', name: 'Furniture & Carpentry', icon: '🪑', desc: 'Bed, cupboard, table, doors' },
  { id: 'cat_5', name: 'Housekeeping & Cleanliness', icon: '🧹', desc: 'Room, corridor, washroom cleaning' },
];

export default function NewComplaintPage({ apiBaseUrl, user, onComplaintCreated, onCancel }) {
  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [roomNumber, setRoomNumber] = useState(user.roomNumber || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please provide a brief title for the issue.');
      return;
    }
    if (!description.trim()) {
      setError('Please describe the problem so maintenance staff can prepare.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          category,
          roomNumber: roomNumber.trim(),
          title: title.trim(),
          description: description.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to file complaint.');
      }

      onComplaintCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div className="portal-card">
        <div className="page-header" style={{ marginBottom: '1.25rem' }}>
          <div>
            <h1 className="page-title">Lodge a Maintenance Complaint</h1>
            <p className="page-desc">Hostel facility staff will be notified immediately</p>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
          >
            ← Back to List
          </button>
        </div>

        {error && (
          <div className="alert alert-error">
            <span>⚠️ {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Category Selection */}
          <div className="form-group">
            <label className="form-label">Select Issue Category</label>
            <div className="category-grid">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`category-chip ${category === cat.name ? 'selected' : ''}`}
                  onClick={() => setCategory(cat.name)}
                >
                  <span className="category-icon">{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Room Number */}
          <div className="form-group">
            <label className="form-label" htmlFor="roomField">Room / Location</label>
            <input
              id="roomField"
              type="text"
              className="form-input"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="e.g. B-204 or Common Room 1st Floor"
              required
            />
          </div>

          {/* Title */}
          <div className="form-group">
            <label className="form-label" htmlFor="titleField">Issue Summary (Title)</label>
            <input
              id="titleField"
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Geyser water not heating / Tube light flickering"
              required
            />
          </div>

          {/* Detailed Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="descField">Detailed Description</label>
            <textarea
              id="descField"
              className="form-textarea"
              rows="4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide exact details (e.g. Since yesterday morning, switch makes a buzzing sound...)"
              required
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
