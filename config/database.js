const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  // Jika sudah connected, return
  if (isConnected) {
    console.log('📡 Using existing MongoDB connection');
    return mongoose.connection;
  }

  try {
    // Hapus deprecated options
    mongoose.set('strictQuery', false);
    
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/basecampgear',
      {
        // Options yang masih relevan
        serverSelectionTimeoutMS: 10000, // 10 seconds timeout
        socketTimeoutMS: 45000, // 45 seconds
        family: 4 // Use IPv4, skip trying IPv6
      }
    );
    
    isConnected = true;
    
    console.log('='.repeat(70));
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
    console.log(`   Port: ${conn.connection.port}`);
    console.log(`   Ready State: ${conn.connection.readyState}`); // 1 = connected
    console.log('='.repeat(70));
    
    return conn;
    
  } catch (error) {
    isConnected = false;
    console.error('='.repeat(70));
    console.error('❌ MongoDB Connection Error:', error.message);
    console.error('MongoDB URI:', process.env.MONGODB_URI || 'not set');
    console.error('='.repeat(70));
    
    // Retry connection after 5 seconds
    console.log('⏳ Retrying connection in 5 seconds...');
    setTimeout(() => {
      connectDB();
    }, 5000);
    
    throw error;
  }
};

// Connection events
mongoose.connection.on('connected', () => {
  isConnected = true;
  console.log('📡 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  isConnected = false;
  console.error('❌ Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.log('📴 Mongoose disconnected from MongoDB');
});

mongoose.connection.on('reconnected', () => {
  isConnected = true;
  console.log('🔄 Mongoose reconnected to MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('🛑 MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error closing MongoDB connection:', err);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  try {
    await mongoose.connection.close();
    console.log('🛑 MongoDB connection closed (SIGTERM)');
    process.exit(0);
  } catch (err) {
    console.error('Error closing MongoDB connection:', err);
    process.exit(1);
  }
});

module.exports = connectDB;
