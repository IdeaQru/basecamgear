require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const connectDB = require('./config/database');

const app = express();
const PORT = process.env.PORT || 4545;

// ==================== START SERVER FUNCTION ====================
async function startServer() {
  try {
    // 1. CONNECT TO DATABASE FIRST
    console.log('🔌 Connecting to MongoDB...');
    await connectDB(); // WAIT for connection
    console.log('✅ Database connection established');
    
    // 2. NOW load models (after DB connected)
    console.log('📦 Loading models...');
    require('./models/Equipment');
    require('./models/RentalOrder');
    console.log('✅ Models loaded');
    
    // 3. Trust proxy
    app.set('trust proxy', 1);
    
    // 4. Middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // 5. Session with MongoStore
    app.use(session({
      secret: process.env.SESSION_SECRET || 'basecamp-gear-fallback-secret',
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/basecampgear',
        collectionName: 'sessions',
        ttl: 24 * 60 * 60,
        autoRemove: 'native'
      }),
      name: 'basecampgear.sid',
      cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/'
      },
      rolling: true
    }));
    
    // 6. Static files
    app.use(express.static(path.join(__dirname, 'public')));
    
    // 7. Debug middleware (optional)
    if (process.env.NODE_ENV !== 'production') {
      app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
        next();
      });
    }
    
    // 8. Routes
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
    
    // 9. Health check
    app.get('/health', (req, res) => {
      const mongoose = require('mongoose');
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: {
          connected: mongoose.connection.readyState === 1,
          readyState: mongoose.connection.readyState,
          host: mongoose.connection.host,
          name: mongoose.connection.name
        },
        uptime: process.uptime(),
        memory: process.memoryUsage()
      });
    });
    
    // 10. 404 handler
    app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.url
      });
    });
    
    // 11. Error handler
    app.use((err, req, res, next) => {
      console.error('❌ Server Error:', err.message);
      console.error('Stack:', err.stack);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
      });
    });
    
    // 12. Start listening
    app.listen(PORT, '0.0.0.0', () => {
      console.log('='.repeat(70));
      console.log('🏕️  BASECAMP GEAR SERVER STARTED');
      console.log('='.repeat(70));
      console.log(`Environment  : ${process.env.NODE_ENV || 'development'}`);
      console.log(`Port         : ${PORT}`);
      console.log(`Server       : http://0.0.0.0:${PORT}`);
      console.log(`Public URL   : http://47.237.23.149:${PORT}`);
      console.log(`Database     : Connected ✅`);
      console.log('='.repeat(70));
      console.log(`🌍 Public    : http://47.237.23.149:${PORT}`);
      console.log(`📊 Dashboard : http://47.237.23.149:${PORT}/dashboard`);
      console.log(`🔐 Login     : http://47.237.23.149:${PORT}/login`);
      console.log(`💚 Health    : http://47.237.23.149:${PORT}/health`);
      console.log('='.repeat(70));
    });
    
  } catch (error) {
    console.error('='.repeat(70));
    console.error('💥 FAILED TO START SERVER');
    console.error('Error:', error.message);
    console.error('='.repeat(70));
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received');
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// START THE SERVER
startServer();

module.exports = app;
