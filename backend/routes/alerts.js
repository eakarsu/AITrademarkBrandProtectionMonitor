const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { callOpenRouter } = require('../services/openrouter');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM alerts ORDER BY triggered_at DESC');
    res.json(result.rows);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM alerts WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/', async (req, res) => {
  try {
    const { title, alert_type, severity, source, message, related_id, related_type } = req.body;
    const result = await pool.query(
      `INSERT INTO alerts (title, alert_type, severity, source, message, related_id, related_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [title, alert_type || req.body.alertType, severity || 'medium', source, message, related_id || req.body.relatedId, related_type || req.body.relatedType]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, alert_type, severity, source, message, is_read } = req.body;
    const result = await pool.query(
      `UPDATE alerts SET title=$1, alert_type=$2, severity=$3, source=$4, message=$5, is_read=$6
       WHERE id=$7 RETURNING *`,
      [title, alert_type || req.body.alertType, severity, source, message, is_read || req.body.isRead || false, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/:id/read', async (req, res) => {
  try {
    const result = await pool.query('UPDATE alerts SET is_read = true WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM alerts WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/triage', async (req, res) => {
  try {
    const { title, alertType, message, source } = req.body;
    const prompt = `Triage and analyze this brand protection alert:\n\nAlert Title: "${title}"\nAlert Type: ${alertType || 'Unknown'}\nSource: ${source || 'Unknown'}\nMessage: "${message || 'N/A'}"\n\nProvide:\n1. Severity Classification (low/medium/high/critical)\n2. Threat Type Categorization\n3. Urgency Assessment\n4. Potential Business Impact\n5. Recommended Response Priority\n6. Suggested Investigation Steps\n7. Escalation Recommendation (yes/no and to whom)\n8. Estimated Resolution Timeline\n9. Related Risk Areas`;
    const systemPrompt = 'You are a brand protection alert analyst. Triage and classify alerts to help teams prioritize their response. Be concise but thorough in your assessment.';
    const aiAnalysis = await callOpenRouter(prompt, systemPrompt);
    res.json({ ai_analysis: aiAnalysis });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
