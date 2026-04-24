const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { callOpenRouter } = require('../services/openrouter');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reports ORDER BY generated_at DESC');
    res.json(result.rows);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reports WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/', async (req, res) => {
  try {
    const { title, report_type, period, status, content } = req.body;
    const result = await pool.query(
      `INSERT INTO reports (title, report_type, period, status, content, ai_generated)
       VALUES ($1,$2,$3,$4,$5,false) RETURNING *`,
      [title, report_type || req.body.reportType, period, status || 'draft', content]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, report_type, period, status, content } = req.body;
    const result = await pool.query(
      `UPDATE reports SET title=$1, report_type=$2, period=$3, status=$4, content=$5
       WHERE id=$6 RETURNING *`,
      [title, report_type || req.body.reportType, period, status, content, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM reports WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/generate', async (req, res) => {
  try {
    const { title, reportType, period } = req.body;
    const prompt = `Generate a comprehensive brand protection report:\n\nReport Title: "${title}"\nReport Type: ${reportType}\nPeriod: ${period || 'Last Quarter'}\n\nGenerate a detailed report including:\n1. Executive Summary\n2. Trademark Portfolio Overview\n3. Infringement Activity Summary\n4. Domain Monitoring Results\n5. Counterfeit Detection Findings\n6. Social Media Brand Mentions Analysis\n7. Competitor Activity\n8. Legal Case Updates\n9. Risk Assessment Matrix\n10. Key Metrics & KPIs\n11. Recommendations & Action Items\n12. Outlook for Next Period`;
    const systemPrompt = 'You are a senior brand protection analyst. Generate comprehensive, executive-ready reports with data-driven insights, clear metrics, and actionable recommendations. Use professional formatting with sections and bullet points.';
    const content = await callOpenRouter(prompt, systemPrompt);
    const result = await pool.query(
      `INSERT INTO reports (title, report_type, period, status, content, ai_generated) VALUES ($1,$2,$3,'completed',$4,true) RETURNING *`,
      [title, reportType, period || 'Last Quarter', content]
    );
    res.json({ ...result.rows[0], content });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
