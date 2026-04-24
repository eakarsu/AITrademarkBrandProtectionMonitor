const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { callOpenRouter } = require('../services/openrouter');

// GET /api/trademarks
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM trademarks ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching trademarks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/trademarks/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM trademarks WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trademark not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching trademark:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/trademarks
router.post('/', async (req, res) => {
  try {
    const { name, registration_number, status, jurisdiction, filing_date, expiry_date, class: tmClass, owner, description } = req.body;
    const result = await pool.query(
      `INSERT INTO trademarks (name, registration_number, status, jurisdiction, filing_date, expiry_date, class, owner, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, registration_number, status || 'active', jurisdiction, filing_date, expiry_date, tmClass, owner, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating trademark:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/trademarks/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, registration_number, status, jurisdiction, filing_date, expiry_date, class: tmClass, owner, description } = req.body;
    const result = await pool.query(
      `UPDATE trademarks SET name = $1, registration_number = $2, status = $3, jurisdiction = $4,
       filing_date = $5, expiry_date = $6, class = $7, owner = $8, description = $9
       WHERE id = $10 RETURNING *`,
      [name, registration_number, status, jurisdiction, filing_date, expiry_date, tmClass, owner, description, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trademark not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating trademark:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/trademarks/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM trademarks WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trademark not found' });
    }
    res.json({ message: 'Trademark deleted', trademark: result.rows[0] });
  } catch (error) {
    console.error('Error deleting trademark:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/trademarks/assess - AI Risk Assessment
router.post('/assess', async (req, res) => {
  try {
    const { name, jurisdiction, niceClass, description } = req.body;
    const prompt = `Perform a comprehensive trademark risk assessment:\n\nTrademark Name: "${name}"\nJurisdiction: ${jurisdiction || 'Global'}\nNice Class: ${niceClass || 'N/A'}\nDescription: ${description || 'N/A'}\n\nProvide:\n1. Trademark Strength Score (1-100)\n2. Distinctiveness Assessment (generic/descriptive/suggestive/arbitrary/fanciful)\n3. Registration Likelihood\n4. Potential Conflicts & Risks\n5. Geographic Protection Gaps\n6. Renewal & Maintenance Recommendations\n7. Brand Value Estimation Factors\n8. Protection Strategy Recommendations\n9. Monitoring Priority Areas\n10. Overall Risk Level (low/medium/high/critical)`;
    const systemPrompt = 'You are a trademark valuation and risk assessment expert. Evaluate trademarks for strength, distinctiveness, and protection strategy. Provide actionable insights for brand owners.';
    const aiAnalysis = await callOpenRouter(prompt, systemPrompt);
    res.json({ ai_analysis: aiAnalysis });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
