const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { callOpenRouter } = require('../services/openrouter');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM trademark_searches ORDER BY searched_at DESC');
    res.json(result.rows);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM trademark_searches WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/', async (req, res) => {
  try {
    const { search_term, jurisdiction, status, results_count, ai_analysis } = req.body;
    const result = await pool.query(
      `INSERT INTO trademark_searches (search_term, jurisdiction, status, results_count, ai_analysis)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [search_term || req.body.searchTerm, jurisdiction, status || 'completed', results_count || req.body.resultsCount, ai_analysis]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { search_term, jurisdiction, status, results_count } = req.body;
    const result = await pool.query(
      `UPDATE trademark_searches SET search_term=$1, jurisdiction=$2, status=$3, results_count=$4
       WHERE id=$5 RETURNING *`,
      [search_term || req.body.searchTerm, jurisdiction, status, results_count || req.body.resultsCount, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM trademark_searches WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/search', async (req, res) => {
  try {
    const { searchTerm, jurisdiction } = req.body;
    const prompt = `Conduct a comprehensive trademark search analysis for:\n\nSearch Term: "${searchTerm}"\nJurisdiction: ${jurisdiction || 'Global'}\n\nProvide:\n1. Potential Conflicts (list similar existing trademarks)\n2. Conflict Risk Level for each (low/medium/high)\n3. Nice Classification Analysis\n4. Geographic Coverage Assessment\n5. Registration Recommendations\n6. Overall Registrability Score (0-100%)`;
    const systemPrompt = 'You are a trademark search specialist with deep knowledge of international trademark databases. Provide thorough trademark availability analysis.';
    const aiAnalysis = await callOpenRouter(prompt, systemPrompt);
    const result = await pool.query(
      `INSERT INTO trademark_searches (search_term, jurisdiction, status, ai_analysis) VALUES ($1,$2,'completed',$3) RETURNING *`,
      [searchTerm, jurisdiction || 'Global', aiAnalysis]
    );
    res.json({ ...result.rows[0], ai_analysis: aiAnalysis });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
