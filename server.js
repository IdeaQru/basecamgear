const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
require('./config/database');

// Trust proxy - PENTING untuk production
app.set('trust proxy', 1);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration dengan MongoStore
app.use(session({
  secret: process.env.SESSION_SECRET || 'basecamp-gear-secret-key-2025-change-this',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/basecampgear',
    collectionName: 'sessions',
    ttl: 24 * 60 * 60, // 24 hours in seconds
    autoRemove: 'native', // Auto remove expired sessions
    touchAfter: 24 * 3600, // Lazy session update (only update if 24 hours passed)
    crypto: {
      secret: process.env.SESSION_SECRET || 'basecamp-gear-secret-key-2025-change-this'
    }
  }),
  cookie: {
    secure: false, // Set true jika pakai HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 jam in milliseconds
    sameSite: 'lax',
    path: '/'
  },
  name: 'basecampgear.sid',
  rolling: true // Extend session di setiap request
}));

// Static files
app.use(express.static('public'));

// Debug middleware (comment di production jika tidak perlu)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  console.log('SessionID:', req.sessionID);
  console.log('User:', req.session?.user?.email || 'Not logged in');
  console.log('Cookie:', req.headers.cookie ? 'Present' : 'None');
  console.log('-'.repeat(60));
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
    session: {
      active: !!req.session,
      id: req.sessionID,
      user: req.session?.user?.email || 'Not logged in'
    },
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test session endpoint
app.get('/test-session', (req, res) => {
  // Set test data
  if (!req.session.views) {
    req.session.views = 0;
  }
  req.session.views++;
  
  res.json({
    sessionID: req.sessionID,
    views: req.session.views,
    user: req.session.user || 'No user',
    message: 'Session working!'
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

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, shutting down...');
  process.exit(0);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(70));
  console.log('🏕️  BASECAMP GEAR SERVER STARTED');
  console.log('='.repeat(70));
  console.log(`Environment  : ${process.env.NODE_ENV || 'development'}`);
  console.log(`Port         : ${PORT}`);
  console.log(`Trust Proxy  : Enabled`);
  console.log(`Session Store: MongoDB (connect-mongo)`);
  console.log('-'.repeat(70));
  console.log(`🌍 Public    : http://47.237.23.149:${PORT}`);
  console.log(`📊 Dashboard : http://47.237.23.149:${PORT}/dashboard`);
  console.log(`🔐 Login     : http://47.237.23.149:${PORT}/login`);
  console.log(`💚 Health    : http://47.237.23.149:${PORT}/health`);
  console.log(`🧪 Test      : http://47.237.23.149:${PORT}/test-session`);
  console.log('='.repeat(70));
  console.log(`Admin Email  : ${process.env.ADMIN_EMAIL || 'Not configured'}`);
  console.log(`MongoDB      : ${process.env.MONGODB_URI || 'localhost:27017/basecampgear'}`);
  console.log('='.repeat(70));
});

module.exports = app;
