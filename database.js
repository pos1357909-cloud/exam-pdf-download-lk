const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }

  const uri = process.env.MONGO_URI || 'mongodb+srv://AZR:ex4224Tn@cluster0.7elrhpn.mongodb.net/?appName=Cluster0';

  try {
    const db = await mongoose.connect(uri, {
      bufferCommands: false,
    });
    isConnected = db.connections[0].readyState === 1;
    console.log('MongoDB Connected Successfully');
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    throw error;
  }
};

module.exports = connectDB;