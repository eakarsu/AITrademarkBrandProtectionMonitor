const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { callOpenRouter, parseAIJson } = require('../services/openrouter');

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const total = await pool.query('SELECT COUNT(*) FROM sentiment_analyses');
    const result = await pool.query('SELECT * FROM sentiment_analyses ORDER BY analyzed_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({
      data: result.rows,
      pagination: { page, limit, total: parseInt(total.rows[0].count), pages: Math.ceil(total.rows[0].count / limit) }
    });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sentiment_analyses WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/', async (req, res) => {
  try {
    const { brand_name, source, period, positive_score, negative_score, neutral_score, summary, ai_analysis } = req.body;
    const result = await pool.query(
      `INSERT INTO sentiment_analyses (brand_name, source, period, positive_score, negative_score, neutral_score, summary, ai_analysis)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [brand_name || req.body.brandName, source, period, positive_score || req.body.positiveScore, negative_score || req.body.negativeScore, neutral_score || req.body.neutralScore, summary, ai_analysis]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { brand_name, source, period, positive_score, negative_score, neutral_score, summary } = req.body;
    const result = await pool.query(
      `UPDATE sentiment_analyses SET brand_name=$1, source=$2, period=$3, positive_score=$4, negative_score=$5, neutral_score=$6, summary=$7
       WHERE id=$8 RETURNING *`,
      [brand_name || req.body.brandName, source, period, positive_score || req.body.positiveScore, negative_score || req.body.negativeScore, neutral_score || req.body.neutralScore, summary, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM sentiment_analyses WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

// POST /analyze - FIXED: No more Math.random(), parse actual AI scores
router.post('/analyze', async (req, res) => {
  try {
    const { brandName, source, period } = req.body;
    const prompt = `Perform a comprehensive brand sentiment analysis:\n\nBrand: "${brandName}"\nSource: ${source || 'All platforms'}\nPeriod: ${period || 'Last 30 days'}\n\nReturn ONLY valid JSON with this exact structure:\n{"sentiment_score": 0.75, "positive_pct": 65, "negative_pct": 15, "neutral_pct": 20, "key_themes": ["string","string"], "brand_risk": "low|medium|high", "summary": "string"}`;
    const systemPrompt = 'You are a brand analytics expert specializing in sentiment analysis. Return ONLY valid JSON with numeric scores based on analysis, not random values.';

    const raw = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(raw);

    // Use AI-parsed scores (no Math.random())
    const positiveScore = parsed?.positive_pct || parsed?.sentiment_score * 100 || 50;
    const negativeScore = parsed?.negative_pct || 20;
    const neutralScore = parsed?.neutral_pct || (100 - positiveScore - negativeScore);

    const result = await pool.query(
      `INSERT INTO sentiment_analyses (brand_name, source, period, positive_score, negative_score, neutral_score, ai_analysis)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [brandName, source || 'All platforms', period || 'Last 30 days', positiveScore, negativeScore, neutralScore, raw]
    );
    res.json({ ...result.rows[0], parsed, ai_analysis: raw });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
