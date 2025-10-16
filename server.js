require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4545;

// ==================== DATABASE CONNECTION ====================
require('./config/database');

// ==================== TRUST PROXY ====================
// PENTING untuk production (di belakang nginx/reverse proxy)
app.set('trust proxy', 1);

// ==================== MIDDLEWARE ====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== SESSION dengan MONGOSTORE ====================
app.use(session({
  secret: process.env.SESSION_SECRET || 'basecamp-gear-fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/basecampgear',
    collectionName: 'sessions',
    ttl: 24 * 60 * 60, // 24 hours in seconds
    autoRemove: 'native', // Auto remove expired sessions
    touchAfter: 24 * 3600, // Lazy update (only update if 24h passed)
    crypto: {
      secret: process.env.SESSION_SECRET || 'basecamp-gear-fallback-secret-key'
    }
  }),
  name: 'basecampgear.sid',
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    httpOnly: true,
    secure: false, // Set true jika pakai HTTPS
    sameSite: 'lax', // 'strict' terlalu ketat, 'lax' lebih baik
    path: '/'
  },
  rolling: true // Extend session on every request
}));

// ==================== STATIC FILES ====================
app.use(express.static(path.join(__dirname, 'public')));

// ==================== DEBUG MIDDLEWARE (Optional) ====================
// Comment di production jika tidak perlu
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    console.log('Session ID:', req.sessionID);
    console.log('User:', req.session?.user?.email || 'Not logged in');
    console.log('-'.repeat(60));
    next();
  });
}

// ==================== ROUTES ====================
const indexRoute = require('./routes/index');
const loginRoute = require('./routes/login');
const orderRoute = require('./routes/order');
const dashboardRoute = require('./routes/dashboard');
const equipmentRoute = require('./routes/equipment');

app.use('/', indexRoute);
app.use('/login', loginRoute);
app.use('/order', orderRoute);
app.use('/dashboard', dashboardRoute);
app.use('/equipment', equipmentRoute);

// ==================== HEALTH CHECK ====================
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    session: {
      active: !!req.session,
      id: req.sessionID,
      user: req.session?.user?.email || 'Not logged in'
    },
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// ==================== 404 HANDLER ====================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.url,
    method: req.method
  });
});

// ==================== ERROR HANDLER ====================
app.use((err, req, res, next) => {
  console.error('='.repeat(70));
  console.error('❌ SERVER ERROR:', err.message);
  console.error('URL:', req.url);
  console.error('Method:', req.method);
  console.error('Stack:', err.stack);
  console.error('='.repeat(70));
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ==================== GRACEFUL SHUTDOWN ====================
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, shutting down...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// ==================== START SERVER ====================
app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(70));
  console.log('🏕️  BASECAMP GEAR SERVER');
  console.log('='.repeat(70));
  console.log(`Environment  : ${process.env.NODE_ENV || 'development'}`);
  console.log(`Port         : ${PORT}`);
  console.log(`Server       : http://0.0.0.0:${PORT}`);
  console.log(`Public URL   : http://47.237.23.149:${PORT}`);
  console.log(`Trust Proxy  : Enabled`);
  console.log(`Session Store: MongoDB`);
  console.log('-'.repeat(70));
  console.log(`🌍 Public    : http://47.237.23.149:${PORT}`);
  console.log(`📊 Dashboard : http://47.237.23.149:${PORT}/dashboard`);
  console.log(`🔐 Login     : http://47.237.23.149:${PORT}/login`);
  console.log(`💚 Health    : http://47.237.23.149:${PORT}/health`);
  console.log('='.repeat(70));
  console.log(`Admin Email  : ${process.env.ADMIN_EMAIL || 'Not configured'}`);
  console.log(`MongoDB URI  : ${process.env.MONGODB_URI || 'localhost:27017/basecampgear'}`);
  console.log('='.repeat(70));
});

module.exports = app;
