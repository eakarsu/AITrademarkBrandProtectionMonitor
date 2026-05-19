const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const PDFDocument = require('pdfkit');

// rate limiter (use ipKeyGenerator if available)
let keyGenerator;
try {
  const { ipKeyGenerator } = require('express-rate-limit');
  if (typeof ipKeyGenerator === 'function') keyGenerator = ipKeyGenerator;
} catch (e) { /* noop */ }

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  ...(keyGenerator ? { keyGenerator } : {}),
});
router.use(limiter);

// ---- In-memory watchlist store (CRUD) ----
let WATCHLIST_SEQ = 6;
const WATCHLIST = [
  { id: 1, keyword: 'ACME', channel: 'amazon', severity: 'high', action: 'auto-takedown', enabled: true, createdAt: '2026-05-01T10:00:00Z' },
  { id: 2, keyword: 'acm3-pro', channel: 'ebay', severity: 'high', action: 'manual-review', enabled: true, createdAt: '2026-05-02T11:30:00Z' },
  { id: 3, keyword: 'ACME OUTLET', channel: 'instagram', severity: 'medium', action: 'alert', enabled: true, createdAt: '2026-05-03T09:15:00Z' },
  { id: 4, keyword: 'acme-store', channel: 'domain', severity: 'high', action: 'auto-cease-desist', enabled: true, createdAt: '2026-05-04T14:00:00Z' },
  { id: 5, keyword: 'fake acme', channel: 'tiktok', severity: 'medium', action: 'alert', enabled: false, createdAt: '2026-05-05T08:20:00Z' },
];

// ---- VIZ 1: Infringement detection trend ----
// GET /api/custom-views/infringement-trend?days=14
router.get('/infringement-trend', (req, res) => {
  const days = Math.min(parseInt(req.query.days, 10) || 14, 60);
  const today = new Date();
  const series = [];
  let cumulative = 240;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    const detected = 8 + Math.round(Math.sin(i / 2) * 4) + (i % 5);
    const resolved = 5 + Math.round(Math.cos(i / 3) * 3) + (i % 4);
    const pending = Math.max(0, detected - resolved);
    cumulative += detected - resolved;
    series.push({ date, detected, resolved, pending, cumulative });
  }
  res.json({
    range: { days, start: series[0]?.date, end: series[series.length - 1]?.date },
    totals: {
      detected: series.reduce((s, x) => s + x.detected, 0),
      resolved: series.reduce((s, x) => s + x.resolved, 0),
      pending: series.reduce((s, x) => s + x.pending, 0),
    },
    series,
  });
});

// ---- VIZ 2: Class/category x region heatmap ----
// GET /api/custom-views/class-region-heatmap
router.get('/class-region-heatmap', (req, res) => {
  const classes = [
    'Class 9 - Electronics',
    'Class 25 - Apparel',
    'Class 35 - Advertising',
    'Class 41 - Education',
    'Class 42 - Software',
    'Class 5  - Pharma',
  ];
  const regions = ['US', 'EU', 'UK', 'CN', 'JP', 'BR', 'IN'];
  const cells = [];
  classes.forEach((cls, ci) => {
    regions.forEach((reg, ri) => {
      const base = ((ci * 7 + ri * 3) % 11) + 1;
      const intensity = Math.min(100, base * 8 + (ci === 4 && reg === 'CN' ? 35 : 0));
      cells.push({
        class: cls,
        region: reg,
        count: base + (ci === 4 && reg === 'CN' ? 20 : 0),
        intensity,
        risk: intensity > 70 ? 'high' : intensity > 40 ? 'medium' : 'low',
      });
    });
  });
  res.json({
    classes,
    regions,
    cells,
    hotspots: cells.filter(c => c.risk === 'high').slice(0, 5),
  });
});

// ---- NON-VIZ 1: Monitoring report PDF ----
// GET /api/custom-views/monitoring-report.pdf
router.get('/monitoring-report.pdf', (req, res) => {
  try {
    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="brand-monitoring-report.pdf"');
    doc.pipe(res);

    doc.fontSize(20).fillColor('#1a365d').text('Brand Protection Monitoring Report', { align: 'left' });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#666').text(`Generated: ${new Date().toISOString()}`);
    doc.moveDown();

    doc.fontSize(14).fillColor('#000').text('Executive Summary');
    doc.fontSize(10).fillColor('#333').text(
      'This report summarizes infringement detection activity, enforcement actions, watchlist coverage, and high-risk class/region hotspots over the most recent monitoring window.'
    );
    doc.moveDown();

    doc.fontSize(14).fillColor('#000').text('Detection Metrics');
    const rows = [
      ['Total infringements detected', '187'],
      ['Resolved (cease & desist)', '112'],
      ['Pending review', '34'],
      ['Counterfeit listings flagged', '46'],
      ['Suspicious domains', '21'],
    ];
    rows.forEach(([k, v]) => doc.fontSize(10).fillColor('#333').text(`  - ${k}: ${v}`));
    doc.moveDown();

    doc.fontSize(14).fillColor('#000').text('Active Watchlist Entries');
    WATCHLIST.filter(w => w.enabled).slice(0, 10).forEach((w, i) => {
      doc.fontSize(10).fillColor('#333').text(`  ${i + 1}. "${w.keyword}" -> ${w.channel} [${w.severity}] => ${w.action}`);
    });
    doc.moveDown();

    doc.fontSize(14).fillColor('#000').text('High-Risk Hotspots');
    doc.fontSize(10).fillColor('#333')
      .text('  - Class 42 (Software) x CN: critical, 25 incidents')
      .text('  - Class 25 (Apparel) x EU: elevated, 14 incidents')
      .text('  - Class 9  (Electronics) x US: elevated, 12 incidents');
    doc.moveDown();

    doc.fontSize(9).fillColor('#888').text('AI Trademark & Brand Protection Monitor - Confidential', { align: 'center' });

    doc.end();
  } catch (err) {
    console.error('PDF error', err);
    res.status(500).json({ error: 'PDF generation failed' });
  }
});

// ---- NON-VIZ 2: Watchlist / enforcement rules CRUD ----
// GET list, POST create, PUT update, DELETE remove
router.get('/watchlist', (req, res) => {
  res.json({
    total: WATCHLIST.length,
    enabled: WATCHLIST.filter(w => w.enabled).length,
    channels: Array.from(new Set(WATCHLIST.map(w => w.channel))),
    items: WATCHLIST,
  });
});

router.post('/watchlist', (req, res) => {
  const { keyword, channel, severity, action, enabled } = req.body || {};
  if (!keyword || !channel) {
    return res.status(400).json({ error: 'keyword and channel are required' });
  }
  const item = {
    id: ++WATCHLIST_SEQ,
    keyword: String(keyword).slice(0, 120),
    channel: String(channel).slice(0, 40),
    severity: ['low', 'medium', 'high'].includes(severity) ? severity : 'medium',
    action: action || 'alert',
    enabled: enabled !== false,
    createdAt: new Date().toISOString(),
  };
  WATCHLIST.push(item);
  res.status(201).json(item);
});

router.put('/watchlist/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = WATCHLIST.findIndex(w => w.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const { keyword, channel, severity, action, enabled } = req.body || {};
  WATCHLIST[idx] = {
    ...WATCHLIST[idx],
    ...(keyword !== undefined && { keyword: String(keyword).slice(0, 120) }),
    ...(channel !== undefined && { channel: String(channel).slice(0, 40) }),
    ...(severity !== undefined && { severity }),
    ...(action !== undefined && { action }),
    ...(enabled !== undefined && { enabled: !!enabled }),
  };
  res.json(WATCHLIST[idx]);
});

router.delete('/watchlist/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = WATCHLIST.findIndex(w => w.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const [removed] = WATCHLIST.splice(idx, 1);
  res.json({ ok: true, removed });
});

module.exports = router;
