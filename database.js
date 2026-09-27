const mongoose = require('mongoose');
const dns = require('dns');

// Configure DNS servers to avoid local ISP/DNS SRV resolution failures
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return true;
  }

  const uri = process.env.MONGO_URI || 'mongodb+srv://AZR:ex4224Tn@cluster0.7elrhpn.mongodb.net/?appName=Cluster0';

  try {
    const db = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000
    });
    isConnected = db.connections[0].readyState === 1;
    console.log('MongoDB Connected Successfully');
    return true;
  } catch (error) {
    console.warn('MongoDB Connection Warning (Using Fallback Storage):', error.message);
    isConnected = false;
    return false;
  }
};

module.exports = connectDB;