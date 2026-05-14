const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3001;

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Public routes
app.use('/api/auth', require('./routes/auth'));

// Audit middleware for mutations
const { authenticateToken } = require('./middleware/auth');
const auditMiddleware = require('./middleware/audit');

// Protect all /api routes except /api/auth
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/auth')) return next();
  authenticateToken(req, res, next);
});

// Audit log on mutations
app.use('/api', auditMiddleware);

// Protected routes
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

app.use('/api/visual-counterfeit-detection', require('./routes/visualCounterfeitDetection')); app.use('/api/cease-desist-drafter', require('./routes/ceaseDesistDrafter')); app.use('/api/franchise-brand-protection', require('./routes/franchiseBrandProtection')); app.use('/api/market-expansion-scouting', require('./routes/marketExpansionScouting')); app.use('/api/brand-dilution-scoring', require('./routes/brandDilutionScoring')); app.use('/api/uspto-wipo-feed', require('./routes/usptoWipoFeed'));

// === Batch 08 Gaps & Frontend Mounts ===
app.use('/api/gap-no-ai-for-counterfeit-image-analysis-computer-vision', require('./routes/gapNoAiForCounterfeitImageAnalysisComputerVision'));
app.use('/api/gap-no-ai-for-automated-cease-and-desist-drafting-beyond-stub', require('./routes/gapNoAiForAutomatedCeaseAndDesistDraftingBeyondStub'));
app.use('/api/gap-no-predictive-enforcement-outcome-model', require('./routes/gapNoPredictiveEnforcementOutcomeModel'));
app.use('/api/gap-no-direct-integration-with-uspto-wipo-databases-only', require('./routes/gapNoDirectIntegrationWithUsptoWipoDatabasesOnly'));
app.use('/api/gap-no-integration-with-law-firms-for-enforcement-workflow', require('./routes/gapNoIntegrationWithLawFirmsForEnforcementWorkflow'));
app.use('/api/gap-no-multi-language-support', require('./routes/gapNoMultiLanguageSupport'));
app.use('/api/gap-no-geographic-jurisdiction-filtering', require('./routes/gapNoGeographicJurisdictionFiltering'));
app.use('/api/gap-no-webhooks-for-real-time-alert-delivery', require('./routes/gapNoWebhooksForRealTimeAlertDelivery'));
app.use('/api/gap-no-notifications-routing-beyond-alerts-js', require('./routes/gapNoNotificationsRoutingBeyondAlertsJs'));

app.listen(PORT, () => {
  console.log(`Trademark Monitor API running on port ${PORT}`);
});

module.exports = app;
