const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { authenticateToken: auth } = require('./middleware/auth');
const { validateRuntime } = require('./governance/runtime');
const { createProviderGate } = require('./governance/providerGate');
const { prepareRuntime } = require('./runtime-bootstrap');

validateRuntime();

const app = express();
const PORT = Number(process.env.BACKEND_PORT);
if (!Number.isInteger(PORT) || PORT < 1) throw new Error('BACKEND_PORT is required');
const allowedOrigins = String(process.env.CORS_ORIGINS || '')
  .split(',').map((value) => value.trim()).filter(Boolean);
if (!allowedOrigins.length) throw new Error('CORS_ORIGINS is required');
const providerPrefixes = [
  '/api/trademarks', '/api/infringements', '/api/domains', '/api/social-mentions',
  '/api/counterfeits', '/api/cease-desist', '/api/trademark-searches',
  '/api/sentiment', '/api/competitors', '/api/logos', '/api/marketplace',
  '/api/legal-cases', '/api/reports', '/api/alerts', '/api/audit-logs', '/api/ai',
  '/api/visual-counterfeit-detection', '/api/cease-desist-drafter',
  '/api/franchise-brand-protection', '/api/market-expansion-scouting',
  '/api/brand-dilution-scoring', '/api/uspto-wipo-feed', '/api/gap-',
];

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS origin denied'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/governance', require('./governance/router'));
app.use('/api', auth);
app.use(createProviderGate(providerPrefixes));
app.use('/api', require('./middleware/audit'));
app.use('/api/custom-views', require('./routes/customViews'));

if (process.env.ENABLE_LEGACY_PROVIDER_ROUTES === 'true') {
  const legacyRoutes = [
    ['/api/trademarks', './routes/trademarks'],
    ['/api/infringements', './routes/infringements'],
    ['/api/domains', './routes/domains'],
    ['/api/social-mentions', './routes/social'],
    ['/api/counterfeits', './routes/counterfeits'],
    ['/api/cease-desist', './routes/ceasedesist'],
    ['/api/trademark-searches', './routes/search'],
    ['/api/sentiment', './routes/sentiment'],
    ['/api/competitors', './routes/competitors'],
    ['/api/logos', './routes/logos'],
    ['/api/marketplace', './routes/marketplace'],
    ['/api/legal-cases', './routes/legal'],
    ['/api/reports', './routes/reports'],
    ['/api/alerts', './routes/alerts'],
    ['/api/audit-logs', './routes/audit'],
    ['/api/ai', './routes/ai'],
    ['/api/visual-counterfeit-detection', './routes/visualCounterfeitDetection'],
    ['/api/cease-desist-drafter', './routes/ceaseDesistDrafter'],
    ['/api/franchise-brand-protection', './routes/franchiseBrandProtection'],
    ['/api/market-expansion-scouting', './routes/marketExpansionScouting'],
    ['/api/brand-dilution-scoring', './routes/brandDilutionScoring'],
    ['/api/uspto-wipo-feed', './routes/usptoWipoFeed'],
    ['/api/gap-no-ai-for-counterfeit-image-analysis-computer-vision', './routes/gapNoAiForCounterfeitImageAnalysisComputerVision'],
    ['/api/gap-no-ai-for-automated-cease-and-desist-drafting-beyond-stub', './routes/gapNoAiForAutomatedCeaseAndDesistDraftingBeyondStub'],
    ['/api/gap-no-predictive-enforcement-outcome-model', './routes/gapNoPredictiveEnforcementOutcomeModel'],
    ['/api/gap-no-direct-integration-with-uspto-wipo-databases-only', './routes/gapNoDirectIntegrationWithUsptoWipoDatabasesOnly'],
    ['/api/gap-no-integration-with-law-firms-for-enforcement-workflow', './routes/gapNoIntegrationWithLawFirmsForEnforcementWorkflow'],
    ['/api/gap-no-multi-language-support', './routes/gapNoMultiLanguageSupport'],
    ['/api/gap-no-geographic-jurisdiction-filtering', './routes/gapNoGeographicJurisdictionFiltering'],
    ['/api/gap-no-webhooks-for-real-time-alert-delivery', './routes/gapNoWebhooksForRealTimeAlertDelivery'],
    ['/api/gap-no-notifications-routing-beyond-alerts-js', './routes/gapNoNotificationsRoutingBeyondAlertsJs'],
  ];
  for (const [routePath, modulePath] of legacyRoutes) app.use(routePath, require(modulePath));
}

app.use('/api', (req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({ error: 'Internal server error' });
});

async function start() {
  await prepareRuntime();
  return app.listen(PORT, () => console.log(`Trademark Monitor API running on port ${PORT}`));
}

if (require.main === module) start().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exitCode = 1;
});

module.exports = app;
