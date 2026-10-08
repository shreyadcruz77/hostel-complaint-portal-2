import React, { useState, useEffect } from 'react';
import AuthPage from './pages/AuthPage';
import ComplaintsPage from './pages/ComplaintsPage';
import NewComplaintPage from './pages/NewComplaintPage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('hostel_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Current page: 'complaints' | 'new-complaint'
  const [currentPage, setCurrentPage] = useState('complaints');
  const [notification, setNotification] = useState('');

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const handleLoginSuccess = (userData, token) => {
    setUser(userData);
    localStorage.setItem('hostel_user', JSON.stringify(userData));
    if (token) localStorage.setItem('hostel_token', token);
    setCurrentPage('complaints');
    showNotification(`Welcome, ${userData.name}!`);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('hostel_user');
    localStorage.removeItem('hostel_token');
    setCurrentPage('complaints');
  };

  return (
    <div className="app-container">
      {/* Navigation Header */}
      <header className="navbar">
        <div className="nav-content">
          <div className="brand-section">
            <div className="brand-icon">🏢</div>
            <div>
              <div className="brand-title">Hostel Complaint Portal</div>
              <div className="brand-subtitle">Campus Maintenance System</div>
            </div>
          </div>

          {user && (
            <div className="nav-actions">
              <button
                type="button"
                className={`nav-tab ${currentPage === 'complaints' ? 'active' : ''}`}
                onClick={() => setCurrentPage('complaints')}
              >
                📋 Complaints
              </button>
              <button
                type="button"
                className={`nav-tab ${currentPage === 'new-complaint' ? 'active' : ''}`}
                onClick={() => setCurrentPage('new-complaint')}
              >
                ➕ Lodge Complaint
              </button>

              <div className="user-badge">
                <span>👤</span>
                <span>{user.name}</span>
                <span style={{ color: 'var(--text-muted)' }}>| Room {user.roomNumber}</span>
              </div>

              <button
                type="button"
                className="logout-btn"
                onClick={handleLogout}
                title="Log out of portal"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-wrapper">
        {notification && (
          <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
            <span>✅ {notification}</span>
          </div>
        )}

        {!user ? (
          // Page 1: Auth (Login & Register via Minimoth OTP)
          <AuthPage
            apiBaseUrl={API_BASE_URL}
            onLoginSuccess={handleLoginSuccess}
          />
        ) : currentPage === 'new-complaint' ? (
          // Page 3: Lodge Complaint
          <NewComplaintPage
            apiBaseUrl={API_BASE_URL}
            user={user}
            onComplaintCreated={() => {
              setCurrentPage('complaints');
              showNotification('Complaint submitted successfully!');
            }}
            onCancel={() => setCurrentPage('complaints')}
          />
        ) : (
          // Page 2: Complaints List & Status Tracking
          <ComplaintsPage
            apiBaseUrl={API_BASE_URL}
            user={user}
            onNavigateToNew={() => setCurrentPage('new-complaint')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>Hostel Complaint Portal &bull; Workshop Project &bull; OTP Auth via Minimoth API</p>
      </footer>
    </div>
  );
}
