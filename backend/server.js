const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Helper: Normalize phone to E.164 (+91 for 10-digit Indian numbers)
function formatPhoneNumber(phone) {
  if (!phone) return null;
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (/^\d{10}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }
  if (/^\+\d{10,15}$/.test(cleaned)) {
    return cleaned;
  }
  return null;
}

// ==========================================
// 5 BACKEND API ENDPOINTS
// ==========================================

// 1. POST /api/auth/send-otp
// Dispatches OTP to user via Minimoth API (WhatsApp/SMS)
app.post('/api/auth/send-otp', async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ success: false, error: 'Phone number is required.' });
  }

  const formattedPhone = formatPhoneNumber(phone);
  if (!formattedPhone) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid phone format. Please enter a valid 10-digit number or international format (+91...).' 
    });
  }

  const apiKey = process.env.MINIMOTH_API_KEY;
  const isPlaceholderKey = !apiKey || apiKey === 'your_minimoth_api_key_here' || apiKey === 'mock';

  // Demo fallback if Minimoth API key is not configured yet
  if (isPlaceholderKey) {
    console.log(`\n[DEMO MODE] Minimoth API key not configured. Mock OTP for ${formattedPhone} is: 123456\n`);
    return res.json({
      success: true,
      message: 'Demo mode active: Use OTP 123456 to login/register (Configure MINIMOTH_API_KEY in .env for live WhatsApp/SMS)',
      isDemo: true
    });
  }

  try {
    const response = await fetch('https://api.minimoth.dev/v1/otp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey
      },
      body: JSON.stringify({ phone: formattedPhone })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Minimoth API error:', data);
      return res.status(response.status).json({
        success: false,
        error: data.message || 'Failed to send OTP through Minimoth API.'
      });
    }

    return res.json({
      success: true,
      message: 'OTP sent to your phone via WhatsApp / SMS.',
      otp_id: data.otp_id
    });
  } catch (err) {
    console.error('Network error calling Minimoth API:', err);
    return res.status(500).json({
      success: false,
      error: 'Unable to reach Minimoth OTP service. Please verify network or API key.'
    });
  }
});

// 2. POST /api/auth/verify-otp
// Verifies OTP via Minimoth API and logs in or registers user
app.post('/api/auth/verify-otp', async (req, res) => {
  const { phone, code, name, roomNumber } = req.body;

  if (!phone || !code) {
    return res.status(400).json({ success: false, error: 'Phone number and 6-digit OTP code are required.' });
  }

  const formattedPhone = formatPhoneNumber(phone);
  if (!formattedPhone) {
    return res.status(400).json({ success: false, error: 'Invalid phone number format.' });
  }

  const apiKey = process.env.MINIMOTH_API_KEY;
  const isPlaceholderKey = !apiKey || apiKey === 'your_minimoth_api_key_here' || apiKey === 'mock';

  // Verify code
  if (isPlaceholderKey) {
    if (code.trim() !== '123456') {
      return res.status(400).json({ success: false, error: 'Invalid OTP. (Demo code is: 123456)' });
    }
  } else {
    try {
      const response = await fetch('https://api.minimoth.dev/v1/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey
        },
        body: JSON.stringify({ phone: formattedPhone, code: code.trim() })
      });

      const data = await response.json();

      if (!response.ok || data.valid === false || data.error) {
        return res.status(400).json({
          success: false,
          error: data.message || 'Invalid or expired OTP code.'
        });
      }
    } catch (err) {
      console.error('Error verifying OTP with Minimoth:', err);
      return res.status(500).json({ success: false, error: 'Verification service error.' });
    }
  }

  // Check if user exists in database
  let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(formattedPhone);

  if (user) {
    // Existing user login
    return res.json({
      success: true,
      message: 'Logged in successfully.',
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        roomNumber: user.room_number
      },
      token: `mm_token_${user.id}`
    });
  } else {
    // New user registration
    if (!name || !roomNumber) {
      return res.status(400).json({
        success: false,
        isNewUser: true,
        error: 'First-time registration: Please provide your Full Name and Room Number.'
      });
    }

    const userId = 'usr_' + Date.now().toString(36);
    db.prepare('INSERT INTO users (id, phone, name, room_number) VALUES (?, ?, ?, ?)').run(
      userId,
      formattedPhone,
      name.trim(),
      roomNumber.trim()
    );

    return res.status(201).json({
      success: true,
      message: 'Registration and login successful.',
      user: {
        id: userId,
        phone: formattedPhone,
        name: name.trim(),
        roomNumber: roomNumber.trim()
      },
      token: `mm_token_${userId}`
    });
  }
});

// 3. GET /api/complaints
// Fetch complaints (can filter by userId query parameter)
app.get('/api/complaints', (req, res) => {
  const { userId } = req.query;

  try {
    let complaints;
    if (userId) {
      complaints = db.prepare(`
        SELECT c.*, u.name as user_name, u.phone as user_phone
        FROM complaints c
        JOIN users u ON c.user_id = u.id
        WHERE c.user_id = ?
        ORDER BY c.created_at DESC
      `).all(userId);
    } else {
      complaints = db.prepare(`
        SELECT c.*, u.name as user_name, u.phone as user_phone
        FROM complaints c
        JOIN users u ON c.user_id = u.id
        ORDER BY c.created_at DESC
      `).all();
    }

    return res.json({ success: true, complaints });
  } catch (err) {
    console.error('Error fetching complaints:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve complaints.' });
  }
});

// 4. POST /api/complaints
// Lodge a new complaint
app.post('/api/complaints', (req, res) => {
  const { userId, category, title, description, roomNumber } = req.body;

  if (!userId || !category || !title || !description) {
    return res.status(400).json({
      success: false,
      error: 'User ID, Category, Title, and Description are required.'
    });
  }

  // Verify user exists
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found.' });
  }

  const complaintId = 'cmp_' + Date.now().toString(36);
  const targetRoom = roomNumber && roomNumber.trim() ? roomNumber.trim() : user.room_number;

  try {
    db.prepare(`
      INSERT INTO complaints (id, user_id, category, title, description, room_number, status)
      VALUES (?, ?, ?, ?, ?, ?, 'Pending')
    `).run(
      complaintId,
      userId,
      category.trim(),
      title.trim(),
      description.trim(),
      targetRoom
    );

    const created = db.prepare('SELECT * FROM complaints WHERE id = ?').get(complaintId);
    return res.status(201).json({ success: true, complaint: created });
  } catch (err) {
    console.error('Error creating complaint:', err);
    return res.status(500).json({ success: false, error: 'Could not submit complaint.' });
  }
});

// 5. PATCH /api/complaints/:id/status
// Update status of an existing complaint (Pending -> In Progress -> Resolved)
app.patch('/api/complaints/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['Pending', 'In Progress', 'Resolved'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    });
  }

  try {
    const existing = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Complaint not found.' });
    }

    db.prepare('UPDATE complaints SET status = ? WHERE id = ?').run(status, id);
    const updated = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id);

    return res.json({ success: true, complaint: updated });
  } catch (err) {
    console.error('Error updating status:', err);
    return res.status(500).json({ success: false, error: 'Failed to update complaint status.' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` Hostel Complaint Portal Backend running on port ${PORT}`);
  console.log(` Minimoth API Integration: Active`);
  console.log(`===============================================`);
});
