require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const connectDB = require('./config/database');
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  name: 'sessionId',
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Import routes
const indexRoute = require('./routes/index');
const loginRoute = require('./routes/login');
const orderRoute = require('./routes/order');
const dashboardRoute = require('./routes/dashboard');
const equipmentRoute = require('./routes/equipment');

// Use routes
app.use('/', indexRoute);
app.use('/login', loginRoute);
app.use('/order', orderRoute);
app.use('/dashboard', dashboardRoute);
app.use('/equipment', equipmentRoute);

// 404 handler
app.use((req, res) => {
  res.status(404).send('404 - Page Not Found');
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
