const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { callOpenRouter } = require('../services/openrouter');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM domains ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM domains WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/', async (req, res) => {
  try {
    const { domain_name, similarity_score, registrar, registration_date, status, threat_level, related_trademark, ai_analysis } = req.body;
    const result = await pool.query(
      `INSERT INTO domains (domain_name, similarity_score, registrar, registration_date, status, threat_level, related_trademark, ai_analysis)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [domain_name || req.body.domain, similarity_score || req.body.similarityScore, registrar, registration_date, status || 'active', threat_level || req.body.threatLevel, related_trademark, ai_analysis]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { domain_name, similarity_score, registrar, registration_date, status, threat_level, related_trademark } = req.body;
    const result = await pool.query(
      `UPDATE domains SET domain_name=$1, similarity_score=$2, registrar=$3, registration_date=$4, status=$5, threat_level=$6, related_trademark=$7
       WHERE id=$8 RETURNING *`,
      [domain_name || req.body.domain, similarity_score || req.body.similarityScore, registrar, registration_date, status, threat_level || req.body.threatLevel, related_trademark, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM domains WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/scan', async (req, res) => {
  try {
    const { domain } = req.body;
    const prompt = `Analyze the domain "${domain}" for potential typosquatting and brand protection concerns:\n\n1. Generate common typosquatting variations\n2. Assess similarity to known brand domains\n3. Threat Level assessment (low, medium, high, critical)\n4. Registration risk indicators\n5. Recommended monitoring actions\n6. Domain reputation analysis`;
    const systemPrompt = 'You are a cybersecurity expert specializing in domain monitoring, typosquatting detection, and brand protection. Provide thorough domain security analysis.';
    const aiAnalysis = await callOpenRouter(prompt, systemPrompt);
    const result = await pool.query(
      `INSERT INTO domains (domain_name, threat_level, status, ai_analysis) VALUES ($1, 'medium', 'monitoring', $2) RETURNING *`,
      [domain, aiAnalysis]
    );
    res.json({ ...result.rows[0], ai_analysis: aiAnalysis });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
