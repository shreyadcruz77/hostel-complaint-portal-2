import React, { useState, useEffect } from 'react';

export default function AuthPage({ apiBaseUrl, onLoginSuccess }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // OTP Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Step 1: Send OTP via Minimoth API
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!phone || phone.trim().length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (isRegisterMode) {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (!roomNumber.trim()) {
        setError('Please enter your hostel room number.');
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send OTP.');
      }

      setStep('otp');
      setCountdown(45);
      setInfoMessage(data.message || 'OTP dispatched to your phone via WhatsApp/SMS.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP via Minimoth API
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          code: otpCode.trim(),
          name: name.trim(),
          roomNumber: roomNumber.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.isNewUser) {
          setIsRegisterMode(true);
          setStep('phone');
        }
        throw new Error(data.error || 'Verification failed. Please check the code.');
      }

      onLoginSuccess(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '2.5rem auto' }}>
      <div className="portal-card" style={{ boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            className="brand-icon"
            style={{ margin: '0 auto 0.85rem', width: '52px', height: '52px', fontSize: '1.6rem' }}
          >
            🏢
          </div>
          <h1 className="page-title" style={{ fontSize: '1.4rem' }}>Hostel Complaint Portal</h1>
          <p className="page-desc">Instant OTP authentication powered by Minimoth</p>
        </div>

        {/* Tab switch between Login and Register */}
        <div
          style={{
            display: 'flex',
            background: '#f1f5f9',
            borderRadius: '10px',
            padding: '4px',
            marginBottom: '1.5rem',
          }}
        >
          <button
            type="button"
            className="btn"
            style={{
              flex: 1,
              padding: '0.45rem',
              fontSize: '0.85rem',
              borderRadius: '8px',
              background: !isRegisterMode ? '#ffffff' : 'transparent',
              color: !isRegisterMode ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: 700,
              boxShadow: !isRegisterMode ? 'var(--shadow-sm)' : 'none',
            }}
            onClick={() => {
              setIsRegisterMode(false);
              setStep('phone');
              setError('');
              setInfoMessage('');
            }}
          >
            Resident Login
          </button>
          <button
            type="button"
            className="btn"
            style={{
              flex: 1,
              padding: '0.45rem',
              fontSize: '0.85rem',
              borderRadius: '8px',
              background: isRegisterMode ? '#ffffff' : 'transparent',
              color: isRegisterMode ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: 700,
              boxShadow: isRegisterMode ? 'var(--shadow-sm)' : 'none',
            }}
            onClick={() => {
              setIsRegisterMode(true);
              setStep('phone');
              setError('');
              setInfoMessage('');
            }}
          >
            New Resident Sign Up
          </button>
        </div>

        {/* Error and Info messages */}
        {error && (
          <div className="alert alert-error">
            <span>⚠️ {error}</span>
          </div>
        )}
        {infoMessage && (
          <div className="alert alert-info">
            <span>📲 {infoMessage}</span>
          </div>
        )}

        {/* Step 1: Phone / Registration Form */}
        {step === 'phone' ? (
          <form onSubmit={handleSendOtp}>
            {isRegisterMode && (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="nameInput">Full Name</label>
                  <input
                    id="nameInput"
                    type="text"
                    className="form-input"
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="roomInput">Hostel Room Number</label>
                  <input
                    id="roomInput"
                    type="text"
                    className="form-input"
                    placeholder="e.g. B-204"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="phoneInput">Mobile Number</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="phoneInput"
                  type="tel"
                  className="form-input"
                  placeholder="e.g. 9876543210 or +919876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <p className="form-help">
                Minimoth sends a 6-digit OTP directly to your WhatsApp or SMS.
              </p>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
              disabled={loading}
            >
              {loading ? 'Sending OTP...' : 'Send Verification OTP'}
            </button>
          </form>
        ) : (
          /* Step 2: OTP Verification Form */
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="otpInput">Enter 6-Digit OTP</label>
                <button
                  type="button"
                  style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600 }}
                  onClick={() => setStep('phone')}
                >
                  Change Number
                </button>
              </div>
              <input
                id="otpInput"
                type="text"
                maxLength="6"
                className="form-input"
                placeholder="• • • • • •"
                style={{
                  fontSize: '1.4rem',
                  letterSpacing: '0.4rem',
                  textAlign: 'center',
                  fontWeight: 700,
                }}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                autoFocus
                required
              />
              <p className="form-help">
                Delivered to <strong>{phone}</strong>
              </p>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem' }}
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>

            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              {countdown > 0 ? (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Resend OTP in {countdown}s
                </span>
              ) : (
                <button
                  type="button"
                  style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}
                  onClick={handleSendOtp}
                  disabled={loading}
                >
                  Resend OTP
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
