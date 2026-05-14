const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { callOpenRouter, parseAIJson } = require('../services/openrouter');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Rate limiter: 20/hour per user
const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user ? 'user:' + (req.user.id || req.user.userId) : req.ip,
  message: { error: 'AI rate limit exceeded. Try again in an hour.' },
});

// Multer for logo uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, '..', 'uploads');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => cb(null, `logo_${Date.now()}_${file.originalname}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  }
});

async function persistAIResult(userId, endpoint, inputData, result) {
  try {
    await pool.query(
      `CREATE TABLE IF NOT EXISTS ai_results (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        endpoint VARCHAR(100),
        input_data JSONB,
        result JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )`
    );
    await pool.query(
      'INSERT INTO ai_results (user_id, endpoint, input_data, result) VALUES ($1, $2, $3, $4)',
      [userId, endpoint, JSON.stringify(inputData), JSON.stringify(result)]
    );
  } catch (err) {
    console.error('Failed to persist AI result:', err.message);
  }
}

// General-purpose AI brand protection assistant
router.post('/chat', aiRateLimiter, async (req, res) => {
  try {
    const { message, context } = req.body;
    const prompt = `${context ? `Context: ${context}\n\n` : ''}User Question: ${message}`;
    const systemPrompt = `You are an expert AI assistant for the AI Trademark & Brand Protection Monitor platform. You specialize in trademark law, brand protection, IP management, counterfeit detection, domain monitoring, and social media brand monitoring. Provide professional, actionable advice.`;
    const aiResponse = await callOpenRouter(prompt, systemPrompt);
    await persistAIResult(req.user?.id, 'chat', { message }, { response: aiResponse });
    res.json({ response: aiResponse });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// AI Brand Health Check
router.post('/brand-health', aiRateLimiter, async (req, res) => {
  try {
    const { brandName, industry } = req.body;

    // DB-ground: fetch trademark data
    let dbContext = '';
    try {
      const trademarks = await pool.query('SELECT name, status, registration_number, registration_date FROM trademarks WHERE name ILIKE $1 LIMIT 5', [`%${brandName}%`]);
      const infringements = await pool.query('SELECT COUNT(*) as count, severity FROM infringements GROUP BY severity');
      dbContext = `\nTrademarks: ${JSON.stringify(trademarks.rows)}\nInfringement Summary: ${JSON.stringify(infringements.rows)}`;
    } catch (_) {}

    const prompt = `Perform a comprehensive Brand Health Check:\n\nBrand: "${brandName}"\nIndustry: ${industry || 'General'}${dbContext}\n\nReturn JSON: {"strength_index": 0-100, "trademark_status": "string", "risk_areas": ["string"], "recommendations": ["string"], "overall_grade": "A-F", "vulnerability_score": 0-100}`;
    const systemPrompt = 'You are a brand strategy consultant. Return ONLY valid JSON.';
    const raw = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(raw);
    const result = parsed || { response: raw };
    await persistAIResult(req.user?.id, 'brand-health', { brandName }, result);
    res.json({ response: raw, parsed: result });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// AI Risk Scanner
router.post('/risk-scan', aiRateLimiter, async (req, res) => {
  try {
    const { brandName, scanType } = req.body;

    let dbContext = '';
    try {
      const domains = await pool.query('SELECT domain_name, status FROM domains WHERE domain_name ILIKE $1 LIMIT 5', [`%${brandName}%`]);
      const social = await pool.query('SELECT platform, sentiment FROM social_mentions WHERE brand_name ILIKE $1 LIMIT 10', [`%${brandName}%`]);
      dbContext = `\nMonitored Domains: ${JSON.stringify(domains.rows)}\nSocial Mentions: ${JSON.stringify(social.rows)}`;
    } catch (_) {}

    const prompt = `Perform a ${scanType || 'comprehensive'} risk scan for brand "${brandName}":${dbContext}\n\nReturn JSON: {"risks": [{"category": "string", "level": "low|medium|high|critical", "description": "string", "action": "string"}], "overall_risk": "low|medium|high|critical", "priority_actions": ["string"]}`;
    const systemPrompt = 'You are a cybersecurity and brand protection risk analyst. Return ONLY valid JSON.';
    const raw = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(raw);
    const result = parsed || { response: raw };
    await persistAIResult(req.user?.id, 'risk-scan', { brandName }, result);
    res.json({ response: raw, parsed: result });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// AI Enforcement Advisor
router.post('/enforcement', aiRateLimiter, async (req, res) => {
  try {
    const { violationType, platform, description } = req.body;
    const prompt = `Provide enforcement strategy:\n\nViolation Type: ${violationType || 'General'}\nPlatform: ${platform || 'Unknown'}\nDescription: ${description || 'N/A'}\n\nReturn JSON: {"priority": "low|medium|high|critical", "takedown_steps": ["string"], "legal_options": ["string"], "timeline": "string", "success_probability": "string", "evidence_checklist": ["string"]}`;
    const systemPrompt = 'You are a brand enforcement specialist. Return ONLY valid JSON.';
    const raw = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(raw);
    const result = parsed || { response: raw };
    await persistAIResult(req.user?.id, 'enforcement', { violationType, platform }, result);
    res.json({ response: raw, parsed: result });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// POST /api/ai/domain-check - Domain Squatting Watcher (NEW)
router.post('/domain-check', aiRateLimiter, async (req, res) => {
  try {
    const { trademark_name } = req.body;
    if (!trademark_name) return res.status(400).json({ error: 'trademark_name is required' });

    const prompt = `For the trademark/brand "${trademark_name}", generate a comprehensive list of high-risk typosquat, homoglyph, and cybersquatting domain variants that could be used for fraud or brand impersonation.\n\nReturn ONLY valid JSON: {"high_risk_domains": ["string"], "registration_recommendations": ["string"], "typosquat_patterns": ["string"]}`;
    const systemPrompt = 'You are a domain security expert specializing in brand protection. Return ONLY valid JSON.';
    const raw = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(raw);

    // Save to domains table
    if (parsed?.high_risk_domains?.length) {
      for (const domain of parsed.high_risk_domains.slice(0, 10)) {
        try {
          await pool.query(
            `INSERT INTO domains (domain_name, brand_name, status, risk_level, notes) VALUES ($1, $2, 'monitored', 'high', 'AI-generated squatting risk') ON CONFLICT DO NOTHING`,
            [domain, trademark_name]
          );
        } catch (_) {}
      }
    }

    await persistAIResult(req.user?.id, 'domain-check', { trademark_name }, parsed || { response: raw });
    res.json({ result: parsed || { response: raw } });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// POST /api/logos/upload-and-analyze - Logo Vision Analysis (NEW)
router.post('/logo-analyze', aiRateLimiter, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Logo image required' });

    const imageData = fs.readFileSync(req.file.path);
    const base64Image = imageData.toString('base64');
    const mimeType = req.file.mimetype;

    const apiKey = process.env.OPENROUTER_API_KEY;
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://trademark-monitor.app',
        'X-Title': 'AI Trademark Monitor',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-5-sonnet-20241022',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64Image}` }
            },
            {
              type: 'text',
              text: 'Analyze this logo for trademark purposes. Return ONLY valid JSON: {"similarity_assessment": "string", "design_elements": ["string"], "risk_level": "low|medium|high", "distinguishing_features": ["string"], "colors": ["string"], "style": "string"}'
            }
          ]
        }]
      })
    });

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || '';
    const parsed = parseAIJson(raw);

    // Cleanup temp file
    try { fs.unlinkSync(req.file.path); } catch (_) {}

    await persistAIResult(req.user?.id, 'logo-analyze', { filename: req.file.originalname }, parsed || { response: raw });
    res.json({ result: parsed || { response: raw } });
  } catch (error) {
    if (req.file?.path) { try { fs.unlinkSync(req.file.path); } catch (_) {} }
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/brand-sentiment-report - Social Listening Report (NEW)
router.post('/brand-sentiment-report', aiRateLimiter, async (req, res) => {
  try {
    let sentimentData = [], socialData = [];
    try {
      const s = await pool.query('SELECT brand_name, source, period, positive_score, negative_score, neutral_score FROM sentiment_analyses ORDER BY analyzed_at DESC LIMIT 20');
      sentimentData = s.rows;
      const m = await pool.query('SELECT platform, content, sentiment FROM social_mentions ORDER BY created_at DESC LIMIT 30');
      socialData = m.rows;
    } catch (_) {}

    const prompt = `Generate a comprehensive brand health report:\n\nSentiment Data: ${JSON.stringify(sentimentData)}\nSocial Mentions: ${JSON.stringify(socialData)}\n\nReturn ONLY valid JSON: {"overall_sentiment": 0.0, "trend": "improving|declining|stable", "top_threats": ["string"], "recommendations": ["string"], "platform_breakdown": [{"platform": "string", "sentiment": "positive|negative|neutral"}], "summary": "string"}`;
    const systemPrompt = 'You are a brand analytics expert. Return ONLY valid JSON.';
    const raw = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(raw);
    await persistAIResult(req.user?.id, 'brand-sentiment-report', {}, parsed || { response: raw });
    res.json({ result: parsed || { response: raw } });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// POST /api/ai/trademark-strength/:id - Trademark Strength Scorer (NEW)
router.post('/trademark-strength/:id', aiRateLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const tm = await pool.query('SELECT * FROM trademarks WHERE id = $1', [id]);
    if (tm.rows.length === 0) return res.status(404).json({ error: 'Trademark not found' });
    const t = tm.rows[0];

    const prompt = `Assess trademark strength:\n\nName: ${t.name}\nGoods/Services: ${t.goods_services || 'Not specified'}\nStatus: ${t.status}\nRegistration: ${t.registration_number || 'Pending'}\n\nReturn ONLY valid JSON: {"strength_score": 0-100, "category": "generic|descriptive|suggestive|arbitrary|fanciful", "registrability": "string", "risks": ["string"], "recommendations": ["string"]}`;
    const systemPrompt = 'You are a trademark attorney specializing in trademark strength assessment. Return ONLY valid JSON.';
    const raw = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(raw);
    const result = { trademark: t, ...(parsed || { response: raw }) };
    await persistAIResult(req.user?.id, 'trademark-strength', { trademark_id: id }, result);
    res.json({ result });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// AI: Automated Cease-and-Desist letter generator
router.post('/cease-and-desist', aiRateLimiter, async (req, res) => {
  try {
    const { trademark_id, infringer_name, infringer_url, infringement_type, jurisdiction, severity, sender_company } = req.body;

    let trademark = null;
    if (trademark_id) {
      const r = await pool.query('SELECT * FROM trademarks WHERE id = $1', [trademark_id]).catch(() => ({ rows: [] }));
      trademark = r.rows[0] || null;
    }

    const systemPrompt = 'You are a trademark attorney. Draft a professional cease-and-desist letter. Always respond with valid JSON only.';
    const prompt = `Draft a cease-and-desist letter.
Trademark: ${JSON.stringify(trademark || {})}
Sender: ${sender_company || 'Brand Owner'}
Infringer: ${infringer_name || 'Unknown'}
Infringer URL: ${infringer_url || 'n/a'}
Infringement type: ${infringement_type || 'unauthorized use'}
Jurisdiction: ${jurisdiction || 'United States'}
Severity: ${severity || 'medium'}

Return JSON:
{
  "letter": {"subject": "...", "salutation": "...", "body": "...", "closing": "...", "signature_block": "..."},
  "key_legal_arguments": ["..."],
  "demanded_actions": ["..."],
  "deadline_days": <number>,
  "follow_up_recommendation": "...",
  "risk_assessment": "low|medium|high",
  "summary": "..."
}`;
    const raw = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(raw);
    const result = parsed || { raw };
    await persistAIResult(req.user?.id, 'cease-and-desist', { trademark_id, infringer_name }, result);
    res.json({ result });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// AI: Brand dilution scoring — assess risk of dilution from similar marks
router.post('/dilution-score', aiRateLimiter, async (req, res) => {
  try {
    const { trademark_id, similar_marks } = req.body;
    let trademark = null;
    if (trademark_id) {
      const r = await pool.query('SELECT * FROM trademarks WHERE id = $1', [trademark_id]).catch(() => ({ rows: [] }));
      trademark = r.rows[0] || null;
    }
    const competitorMarks = await pool.query('SELECT * FROM competitors LIMIT 30').catch(() => ({ rows: [] }));

    const systemPrompt = 'You are a trademark dilution analyst. Always respond with valid JSON only.';
    const prompt = `Score dilution risk from similar marks.
Trademark: ${JSON.stringify(trademark || {})}
Provided similar marks: ${JSON.stringify(similar_marks || [])}
Competitor reference: ${JSON.stringify(competitorMarks.rows.slice(0, 15))}

Return JSON:
{
  "overall_dilution_score": <0-100>,
  "dilution_type": "blurring|tarnishment|both|none",
  "scored_marks": [{"mark": "...", "category": "...", "similarity_score": <0-100>, "blurring_risk": "low|medium|high", "tarnishment_risk": "low|medium|high"}],
  "recommended_actions": ["..."],
  "summary": "..."
}`;
    const raw = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(raw);
    const result = parsed || { raw };
    await persistAIResult(req.user?.id, 'dilution-score', { trademark_id }, result);
    res.json({ result });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ============================================================
// Apply pass 4 (mechanical backlog) — franchise compliance, market expansion
// 503 when OPENROUTER_API_KEY unset.
// ============================================================
const requireKey = (res) => {
  if (!process.env.OPENROUTER_API_KEY) {
    res.status(503).json({ error: 'AI service not configured', message: 'OPENROUTER_API_KEY is not set' });
    return false;
  }
  return true;
};

// AI: Franchise compliance scoring — score brand-standards compliance across franchise locations
router.post('/franchise-compliance', aiRateLimiter, async (req, res) => {
  try {
    if (!requireKey(res)) return;
    const { brand_name, locations, brand_standards } = req.body || {};
    if (!brand_name) return res.status(400).json({ error: 'brand_name is required' });
    let locArr = locations;
    if (typeof locations === 'string') {
      try { locArr = JSON.parse(locations); } catch (_) { /* fallthrough */ }
    }
    if (!Array.isArray(locArr) || locArr.length === 0) {
      return res.status(400).json({ error: 'locations (non-empty array or JSON array string) is required' });
    }

    const systemPrompt = 'You are a franchise brand-standards compliance analyst. Always respond with valid JSON only.';
    const prompt = `Score franchise compliance.

BRAND: ${brand_name}
BRAND STANDARDS: ${brand_standards ? JSON.stringify(brand_standards) : 'standard franchise brand-identity, signage, marketing, and customer-experience standards'}

LOCATIONS:
${JSON.stringify(locArr, null, 2)}

Return JSON:
{
  "overall_compliance_score": <0-100>,
  "scored_locations": [{"location_id": "...", "compliance_score": <0-100>, "violations": ["..."], "strengths": ["..."], "recommended_actions": ["..."]}],
  "systemic_issues": ["..."],
  "priority_audits": ["..."],
  "summary": "..."
}`;
    const raw = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(raw);
    const result = parsed || { raw };
    await persistAIResult(req.user?.id, 'franchise-compliance', { brand_name, location_count: locArr.length }, result);
    res.json({ result });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// AI: Market expansion scouting — recommend new markets for brand expansion
router.post('/market-expansion', aiRateLimiter, async (req, res) => {
  try {
    if (!requireKey(res)) return;
    const { brand_name, current_markets, candidate_markets, expansion_criteria } = req.body || {};
    if (!brand_name) return res.status(400).json({ error: 'brand_name is required' });

    const systemPrompt = 'You are a brand expansion strategist. Always respond with valid JSON only.';
    const prompt = `Recommend market expansion priorities.

BRAND: ${brand_name}
CURRENT MARKETS: ${current_markets ? JSON.stringify(current_markets) : 'none provided'}
CANDIDATE MARKETS: ${candidate_markets ? JSON.stringify(candidate_markets) : 'open recommendation — propose top markets'}
EXPANSION CRITERIA: ${expansion_criteria ? JSON.stringify(expansion_criteria) : 'demographic fit, regulatory ease, trademark availability, competition'}

Return JSON:
{
  "ranked_markets": [{"market": "...", "fit_score": <0-100>, "rationale": "...", "trademark_risk": "low|medium|high", "competition_level": "low|medium|high", "estimated_entry_cost": "..."}],
  "do_not_enter": [{"market": "...", "reason": "..."}],
  "trademark_filings_needed": ["..."],
  "summary": "..."
}`;
    const raw = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(raw);
    const result = parsed || { raw };
    await persistAIResult(req.user?.id, 'market-expansion', { brand_name }, result);
    res.json({ result });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ============================================================
// Apply pass 5 — remaining backlog
// All NEEDS-CREDS endpoints below short-circuit with 503 + missing
// when their respective env var is unset. The actual external API call
// is NOT made (apply-pass policy disallows new SDK installs); when
// credentials are present, an LLM analysis based on caller-provided
// sample data is returned so the FE can integrate end-to-end.
// ============================================================

// NEEDS-CREDS: USPTO trademark search.
// Env vars required: USPTO_API_KEY (USPTO TSDR / Open Data Portal).
// POST /uspto-search
// Body: { query, classes?:[], sample_results?:[] }
router.post('/uspto-search', aiRateLimiter, async (req, res) => {
  if (!process.env.USPTO_API_KEY) {
    return res.status(503).json({
      error: 'USPTO integration not configured',
      missing: 'USPTO_API_KEY',
    });
  }
  if (!requireKey(res)) return;
  try {
    const { query, classes, sample_results } = req.body || {};
    if (!query) return res.status(400).json({ error: 'query is required' });
    const systemPrompt = 'You are a USPTO trademark search analyst. Given a search query and (caller-supplied) sample results, evaluate likelihood of confusion, prior-art conflicts, and search recommendations. Return ONLY valid JSON.';
    const prompt = `USPTO trademark search analysis.

QUERY: ${query}
CLASSES: ${Array.isArray(classes) ? JSON.stringify(classes) : 'any'}
SAMPLE RESULTS: ${Array.isArray(sample_results) && sample_results.length ? JSON.stringify(sample_results) : 'none provided (would be fetched from USPTO TSDR live)'}

Return JSON: { "conflicts": [{"mark":"","status":"","class":"","risk":"low|medium|high","reason":""}], "registrability_score": 0-100, "recommended_classes": [], "summary": "" }`;
    const raw = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(raw);
    const result = parsed || { raw };
    await persistAIResult(req.user?.id, 'uspto-search', { query, classes }, result);
    res.json({ result });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// NEEDS-CREDS: WIPO international trademark search.
// Env vars required: WIPO_API_KEY (WIPO Madrid Monitor / Global Brand Database).
// POST /wipo-search
// Body: { query, jurisdictions?:[], sample_results?:[] }
router.post('/wipo-search', aiRateLimiter, async (req, res) => {
  if (!process.env.WIPO_API_KEY) {
    return res.status(503).json({
      error: 'WIPO integration not configured',
      missing: 'WIPO_API_KEY',
    });
  }
  if (!requireKey(res)) return;
  try {
    const { query, jurisdictions, sample_results } = req.body || {};
    if (!query) return res.status(400).json({ error: 'query is required' });
    const systemPrompt = 'You are a WIPO Madrid System trademark analyst. Evaluate international registrability, jurisdiction-specific risks, and Madrid Protocol filing strategy. Return ONLY valid JSON.';
    const prompt = `WIPO international trademark search.

QUERY: ${query}
JURISDICTIONS: ${Array.isArray(jurisdictions) && jurisdictions.length ? JSON.stringify(jurisdictions) : 'global'}
SAMPLE RESULTS: ${Array.isArray(sample_results) && sample_results.length ? JSON.stringify(sample_results) : 'none provided (would be fetched from WIPO Global Brand DB live)'}

Return JSON: { "conflicts_by_jurisdiction": {"<country>":[{"mark":"","status":"","risk":""}]}, "madrid_filing_strategy": "", "high_risk_jurisdictions": [], "low_risk_jurisdictions": [], "summary": "" }`;
    const raw = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(raw);
    const result = parsed || { raw };
    await persistAIResult(req.user?.id, 'wipo-search', { query, jurisdictions }, result);
    res.json({ result });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// NEEDS-CREDS: counterfeit-image computer-vision analysis.
// Env vars required: OPENROUTER_VISION_KEY (vision-capable model access).
// Currently uses an LLM-text fallback when only descriptive metadata is
// available; real image bytes would require a vision-model integration.
// POST /counterfeit-image-cv
// Body: { brand_name, image_url?, image_description, marketplace? }
router.post('/counterfeit-image-cv', aiRateLimiter, async (req, res) => {
  if (!process.env.OPENROUTER_VISION_KEY) {
    return res.status(503).json({
      error: 'Counterfeit-image CV not configured',
      missing: 'OPENROUTER_VISION_KEY',
    });
  }
  if (!requireKey(res)) return;
  try {
    const { brand_name, image_url, image_description, marketplace } = req.body || {};
    if (!brand_name || (!image_url && !image_description)) {
      return res.status(400).json({ error: 'brand_name and (image_url or image_description) are required' });
    }
    const systemPrompt = 'You are a counterfeit-product detection AI. Score likelihood that an image depicts a counterfeit of the given brand based on logo, packaging, typography, and marketplace context. Return ONLY valid JSON.';
    const prompt = `Counterfeit image analysis.

BRAND: ${brand_name}
MARKETPLACE: ${marketplace || 'unspecified'}
IMAGE URL: ${image_url || 'not provided'}
IMAGE DESCRIPTION: ${image_description || 'not provided'}

Return JSON: { "counterfeit_likelihood": 0-100, "indicators": [{"type":"logo|packaging|typography|color|misspelling|other","detail":"","weight":0-1}], "authenticity_signals": [], "recommended_action": "monitor|takedown|investigate|ignore", "summary": "" }`;
    const raw = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(raw);
    const result = parsed || { raw };
    await persistAIResult(req.user?.id, 'counterfeit-image-cv', { brand_name, marketplace, image_url }, result);
    res.json({ result });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
