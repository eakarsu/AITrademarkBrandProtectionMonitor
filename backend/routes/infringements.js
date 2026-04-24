const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { callOpenRouter } = require('../services/openrouter');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM infringements ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM infringements WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { trademark_id, source_url, infringement_type, severity, status, description, ai_analysis } = req.body;
    const result = await pool.query(
      `INSERT INTO infringements (trademark_id, source_url, infringement_type, severity, status, description, ai_analysis)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [trademark_id, source_url || req.body.sourceUrl, infringement_type || req.body.type, severity || 'medium', status || 'pending', description, ai_analysis]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { trademark_id, source_url, infringement_type, severity, status, description } = req.body;
    const result = await pool.query(
      `UPDATE infringements SET trademark_id=$1, source_url=$2, infringement_type=$3, severity=$4, status=$5, description=$6
       WHERE id=$7 RETURNING *`,
      [trademark_id, source_url || req.body.sourceUrl, infringement_type || req.body.type, severity, status, description, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM infringements WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted', item: result.rows[0] });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/analyze', async (req, res) => {
  try {
    const { url, description } = req.body;
    const prompt = `Analyze the following URL/content for potential trademark infringement:\n\nURL: ${url}\nDescription: ${description || 'N/A'}\n\nProvide a detailed analysis including:\n1. Infringement Type (domain squatting, counterfeiting, brand impersonation, unauthorized use, etc.)\n2. Severity Level (low, medium, high, critical)\n3. Key Evidence found\n4. Risk Assessment\n5. Recommended Actions\n6. Legal Considerations`;
    const systemPrompt = 'You are an expert trademark and intellectual property attorney AI assistant. Analyze potential trademark infringements with precision and provide actionable legal insights.';
    const aiAnalysis = await callOpenRouter(prompt, systemPrompt);
    const result = await pool.query(
      `INSERT INTO infringements (source_url, infringement_type, severity, status, description, ai_analysis)
       VALUES ($1, 'ai-detected', 'medium', 'pending', $2, $3) RETURNING *`,
      [url, description || 'AI-analyzed infringement', aiAnalysis]
    );
    res.json({ ...result.rows[0], ai_analysis: aiAnalysis });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
