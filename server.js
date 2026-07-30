const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const connectDB = require('./database');
const apiRoutes = require('./api/index');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Optimization Middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// Connect Database before routing
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database Connection Failed' });
  }
});

// API Routes
app.use('/api', apiRoutes);

// Fallback SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;