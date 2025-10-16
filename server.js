require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4545;

// ==================== START SERVER FUNCTION ====================
async function startServer() {
  try {
    // 1. CONNECT TO DATABASE FIRST AND WAIT!
    console.log('🔌 Connecting to MongoDB...');
    const connectDB = require('./config/database');
    await connectDB(); // <- PENTING: AWAIT INI!
    console.log('✅ Database connected');
    
    // 2. NOW configure app (after DB ready)
    app.set('trust proxy', 1);
    
    // 3. Middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // 4. Session with MongoStore
    app.use(session({
      secret: process.env.SESSION_SECRET || 'basecamp-fallback',
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/basecampgear',
        collectionName: 'sessions',
        ttl: 24 * 60 * 60
      }),
      name: 'basecampgear.sid',
      cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: false,
        sameSite: 'lax'
      }
    }));
    
    // 5. Static files
    app.use(express.static(path.join(__dirname, 'public')));
    
    // 6. Routes (load AFTER DB connected)
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
    
    // 7. Health check
    app.get('/health', (req, res) => {
      const mongoose = require('mongoose');
      res.json({
        status: 'OK',
        database: {
          connected: mongoose.connection.readyState === 1,
          readyState: mongoose.connection.readyState
        }
      });
    });
    
    // 8. 404 handler
    app.use((req, res) => {
      res.status(404).json({ success: false, message: 'Not found' });
    });
    
    // 9. Error handler
    app.use((err, req, res, next) => {
      console.error('Server Error:', err);
      res.status(500).json({ success: false, message: 'Internal error' });
    });
    
    // 10. Start listening
    app.listen(PORT, '0.0.0.0', () => {
      console.log('='.repeat(70));
      console.log('🏕️  BASECAMP GEAR SERVER');
      console.log('='.repeat(70));
      console.log(`Environment  : ${process.env.NODE_ENV || 'development'}`);
      console.log(`Port         : ${PORT}`);
      console.log(`Server       : http://0.0.0.0:${PORT}`);
      console.log(`Database     : Connected ✅`);
      console.log('='.repeat(70));
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  process.exit(0);
});

// START THE SERVER
startServer();

module.exports = app;
