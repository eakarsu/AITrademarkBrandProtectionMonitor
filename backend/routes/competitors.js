const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { callOpenRouter, parseAIJson } = require('../services/openrouter');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM competitors ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM competitors WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, website, industry, threat_level, trademark_overlap, market_position, ai_analysis } = req.body;
    const result = await pool.query(
      `INSERT INTO competitors (name, website, industry, threat_level, trademark_overlap, market_position, ai_analysis)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [name, website, industry, threat_level || req.body.threatLevel, trademark_overlap || req.body.trademarkOverlap, market_position || req.body.marketPosition, ai_analysis]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, website, industry, threat_level, trademark_overlap, market_position } = req.body;
    const result = await pool.query(
      `UPDATE competitors SET name=$1, website=$2, industry=$3, threat_level=$4, trademark_overlap=$5, market_position=$6, last_analyzed=NOW()
       WHERE id=$7 RETURNING *`,
      [name, website, industry, threat_level || req.body.threatLevel, trademark_overlap || req.body.trademarkOverlap, market_position || req.body.marketPosition, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM competitors WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

// GET /api/competitors/threat-matrix
router.get('/threat-matrix', async (req, res) => {
  try {
    const competitors = await pool.query('SELECT * FROM competitors ORDER BY created_at DESC');
    if (competitors.rows.length === 0) return res.json({ matrix: [] });

    const prompt = `Rank these competitors by threat level and compute a threat matrix:\n\n${JSON.stringify(competitors.rows)}\n\nReturn ONLY valid JSON: {"matrix": [{"id": 0, "name": "string", "threat_score": 0-100, "threat_level": "low|medium|high|critical", "key_risk": "string", "action": "string"}]}`;
    const raw = await callOpenRouter(prompt, 'You are a competitive intelligence expert. Return ONLY valid JSON.');
    const parsed = parseAIJson(raw);
    res.json(parsed || { matrix: competitors.rows, raw });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/analyze', async (req, res) => {
  try {
    const { name, website } = req.body;
    const prompt = `Analyze this competitor for trademark and brand protection purposes:\n\nCompetitor: "${name}"\nWebsite: ${website || 'N/A'}\n\nProvide:\n1. Brand Strategy Analysis\n2. Trademark Portfolio Assessment\n3. Threat Level (low/medium/high/critical)\n4. Areas of Trademark Overlap\n5. Market Position Assessment\n6. Competitive Brand Risks\n7. Recommended Protective Actions`;
    const systemPrompt = 'You are a competitive intelligence and brand strategy expert. Analyze competitors from a trademark and brand protection perspective.';
    const aiAnalysis = await callOpenRouter(prompt, systemPrompt);
    const result = await pool.query(
      `INSERT INTO competitors (name, website, threat_level, ai_analysis) VALUES ($1,$2,'medium',$3) RETURNING *`,
      [name, website, aiAnalysis]
    );
    res.json({ ...result.rows[0], ai_analysis: aiAnalysis });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
