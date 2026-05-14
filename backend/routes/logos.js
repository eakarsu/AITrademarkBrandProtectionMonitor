const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { callOpenRouter, parseAIJson } = require('../services/openrouter');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

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

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM logo_analyses ORDER BY analyzed_at DESC');
    res.json(result.rows);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM logo_analyses WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/', async (req, res) => {
  try {
    const { original_brand, compared_brand, similarity_score, visual_elements, color_similarity, shape_similarity, risk_level, ai_analysis } = req.body;
    const result = await pool.query(
      `INSERT INTO logo_analyses (original_brand, compared_brand, similarity_score, visual_elements, color_similarity, shape_similarity, risk_level, ai_analysis)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [original_brand || req.body.originalBrand, compared_brand || req.body.comparedBrand, similarity_score || req.body.similarityScore, visual_elements || req.body.visualElements, color_similarity || req.body.colorSimilarity, shape_similarity || req.body.shapeSimilarity, risk_level || req.body.riskLevel, ai_analysis]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { original_brand, compared_brand, similarity_score, visual_elements, color_similarity, shape_similarity, risk_level } = req.body;
    const result = await pool.query(
      `UPDATE logo_analyses SET original_brand=$1, compared_brand=$2, similarity_score=$3, visual_elements=$4, color_similarity=$5, shape_similarity=$6, risk_level=$7
       WHERE id=$8 RETURNING *`,
      [original_brand || req.body.originalBrand, compared_brand || req.body.comparedBrand, similarity_score || req.body.similarityScore, visual_elements || req.body.visualElements, color_similarity || req.body.colorSimilarity, shape_similarity || req.body.shapeSimilarity, risk_level || req.body.riskLevel, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM logo_analyses WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

// POST /api/logos/analyze - text-based comparison (fixed: no Math.random)
router.post('/analyze', async (req, res) => {
  try {
    const { originalBrand, comparedBrand } = req.body;
    const prompt = `Analyze logo similarity between "${originalBrand}" and "${comparedBrand}".\n\nReturn ONLY valid JSON: {"similarity_score": 0-100, "color_similarity": 0-100, "shape_similarity": 0-100, "risk_level": "low|medium|high|critical", "confusion_likelihood": "string", "legal_risk": "string", "recommendations": ["string"], "summary": "string"}`;
    const systemPrompt = 'You are a visual branding and trademark expert. Return ONLY valid JSON with numeric scores derived from analysis.';
    const raw = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(raw);

    const similarityScore = parsed?.similarity_score || 50;
    const colorSimilarity = parsed?.color_similarity || 50;
    const shapeSimilarity = parsed?.shape_similarity || 50;
    const riskLevel = parsed?.risk_level || (similarityScore > 70 ? 'high' : similarityScore > 45 ? 'medium' : 'low');

    const result = await pool.query(
      `INSERT INTO logo_analyses (original_brand, compared_brand, similarity_score, color_similarity, shape_similarity, risk_level, ai_analysis)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [originalBrand, comparedBrand, similarityScore, colorSimilarity, shapeSimilarity, riskLevel, raw]
    );
    res.json({ ...result.rows[0], parsed, ai_analysis: raw });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// POST /api/logos/upload - Upload logo image for vision analysis
router.post('/upload', upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Logo image file required' });

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
              text: 'Analyze this logo for trademark protection purposes. Return ONLY valid JSON: {"similarity_assessment": "string", "design_elements": ["string"], "risk_level": "low|medium|high", "distinguishing_features": ["string"], "colors": ["string"], "style": "string", "trademark_strength": "weak|moderate|strong", "recommendations": ["string"]}'
            }
          ]
        }]
      })
    });

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || '';
    const parsed = parseAIJson(raw);

    // Save to logo_analyses
    const brand = req.body.brand_name || req.file.originalname;
    await pool.query(
      `INSERT INTO logo_analyses (original_brand, risk_level, ai_analysis) VALUES ($1,$2,$3)`,
      [brand, parsed?.risk_level || 'medium', raw]
    ).catch(() => {});

    try { fs.unlinkSync(req.file.path); } catch (_) {}

    res.json({ result: parsed || { response: raw }, filename: req.file.originalname });
  } catch (error) {
    if (req.file?.path) { try { fs.unlinkSync(req.file.path); } catch (_) {} }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
