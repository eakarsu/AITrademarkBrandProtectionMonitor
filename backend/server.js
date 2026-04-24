const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/trademarks', require('./routes/trademarks'));
app.use('/api/infringements', require('./routes/infringements'));
app.use('/api/domains', require('./routes/domains'));
app.use('/api/social-mentions', require('./routes/social'));
app.use('/api/counterfeits', require('./routes/counterfeits'));
app.use('/api/cease-desist', require('./routes/ceasedesist'));
app.use('/api/trademark-searches', require('./routes/search'));
app.use('/api/sentiment', require('./routes/sentiment'));
app.use('/api/competitors', require('./routes/competitors'));
app.use('/api/logos', require('./routes/logos'));
app.use('/api/marketplace', require('./routes/marketplace'));
app.use('/api/legal-cases', require('./routes/legal'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/audit-logs', require('./routes/audit'));
app.use('/api/ai', require('./routes/ai'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`Trademark Monitor API running on port ${PORT}`);
});

module.exports = app;
