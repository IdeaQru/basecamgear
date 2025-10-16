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
    // 1. CONNECT TO DATABASE FIRST - WAIT!
    console.log('🔌 Connecting to MongoDB...');
    const connectDB = require('./config/database');
    await connectDB(); // <- PENTING: AWAIT!!!
    console.log('✅ Database ready!');
    
    // 2. Configure app
    app.set('trust proxy', 1);
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // 3. Session
    app.use(session({
      secret: process.env.SESSION_SECRET || 'basecamp-fallback',
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/basecampgear',
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
    
    // 4. Static files
    app.use(express.static(path.join(__dirname, 'public')));
    
    // 5. Routes (load AFTER DB ready)
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
    
    // 6. Health
    app.get('/health', (req, res) => {
      const mongoose = require('mongoose');
      res.json({
        status: 'OK',
        database: { connected: mongoose.connection.readyState === 1 }
      });
    });
    
    // 7. 404
    app.use((req, res) => {
      res.status(404).json({ success: false, message: 'Not found' });
    });
    
    // 8. Error handler
    app.use((err, req, res, next) => {
      console.error('Server Error:', err);
      res.status(500).json({ success: false, message: 'Internal error' });
    });
    
    // 9. Listen
    app.listen(PORT, '0.0.0.0', () => {
      console.log('='.repeat(70));
      console.log('🏕️  BASECAMP GEAR SERVER');
      console.log('='.repeat(70));
      console.log(`Port         : ${PORT}`);
      console.log(`Database     : Connected ✅`);
      console.log('='.repeat(70));
    });
    
  } catch (error) {
    console.error('❌ Failed to start:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  process.exit(0);
});

// START
startServer();

module.exports = app;
