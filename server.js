const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
require('./config/database');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust proxy - PENTING untuk production
app.set('trust proxy', 1);

// Session configuration - FIXED untuk production
app.use(session({
  secret: process.env.SESSION_SECRET || 'basecamp-gear-secret-key-2025-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set false jika belum pakai HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 jam
    sameSite: 'lax', // PENTING: set ke 'lax' atau 'none'
    domain: undefined // Biarkan undefined untuk auto-detect
  },
  name: 'basecampgear.sid',
  rolling: true // Extend session di setiap request
}));

// Static files
app.use(express.static('public'));

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Session ID:', req.sessionID);
  console.log('Session:', req.session);
  console.log('Cookies:', req.headers.cookie);
  next();
});

// Routes
const loginRoutes = require('./routes/login');
const dashboardRoutes = require('./routes/dashboard');
const equipmentRoutes = require('./routes/equipment');
const orderRoutes = require('./routes/order');

app.use('/login', loginRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/equipment', equipmentRoutes);
app.use('/order', orderRoutes);

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    session: req.session ? 'Active' : 'Inactive'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log('🏕️  Basecamp Gear Server Started');
  console.log('='.repeat(50));
  console.log(`📍 Server: http://0.0.0.0:${PORT}`);
  console.log(`🌍 Public: http://47.237.23.149:${PORT}`);
  console.log(`📊 Dashboard: http://47.237.23.149:${PORT}/dashboard`);
  console.log(`🔐 Login: http://47.237.23.149:${PORT}/login`);
  console.log(`💚 Health: http://47.237.23.149:${PORT}/health`);
  console.log('='.repeat(50));
});

module.exports = app;
