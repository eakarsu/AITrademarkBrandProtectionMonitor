const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { callOpenRouter } = require('../services/openrouter');

router.get('/', async (req, res) => {
  try {
    const { entity_type, user_email, action } = req.query;
    let query = 'SELECT * FROM audit_logs';
    const conditions = [];
    const params = [];

    if (entity_type) { params.push(entity_type); conditions.push(`entity_type = $${params.length}`); }
    if (user_email) { params.push(user_email); conditions.push(`user_email = $${params.length}`); }
    if (action) { params.push(action); conditions.push(`action = $${params.length}`); }

    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY performed_at DESC LIMIT 200';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM audit_logs WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/analyze', async (req, res) => {
  try {
    const { period, focusArea } = req.body;
    const logsResult = await pool.query('SELECT action, entity_type, user_email, COUNT(*) as count FROM audit_logs GROUP BY action, entity_type, user_email ORDER BY count DESC LIMIT 50');
    const logsSummary = logsResult.rows.map(r => `${r.user_email}: ${r.action} on ${r.entity_type} (${r.count}x)`).join('\n');
    const prompt = `Analyze the following audit trail activity patterns for security and compliance concerns:\n\nPeriod: ${period || 'All time'}\nFocus: ${focusArea || 'General'}\n\nActivity Summary:\n${logsSummary || 'No activity data available'}\n\nProvide:\n1. Activity Pattern Analysis\n2. Anomaly Detection (unusual patterns)\n3. Security Risk Indicators\n4. Compliance Assessment\n5. User Behavior Analysis\n6. High-Risk Activities Identified\n7. Recommendations for Improved Security\n8. Audit Compliance Score (0-100%)`;
    const systemPrompt = 'You are a security audit analyst specializing in enterprise compliance and threat detection. Analyze audit trails for anomalies, security risks, and compliance issues.';
    const aiAnalysis = await callOpenRouter(prompt, systemPrompt);
    res.json({ ai_analysis: aiAnalysis });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
