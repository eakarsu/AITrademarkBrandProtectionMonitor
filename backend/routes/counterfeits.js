const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { callOpenRouter } = require('../services/openrouter');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM counterfeits ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM counterfeits WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/', async (req, res) => {
  try {
    const { product_name, platform, seller, url, price, original_price, status, evidence, ai_analysis } = req.body;
    const result = await pool.query(
      `INSERT INTO counterfeits (product_name, platform, seller, url, price, original_price, status, evidence, ai_analysis)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [product_name || req.body.productName, platform, seller, url || req.body.productUrl, price, original_price || req.body.originalPrice, status || 'active', evidence, ai_analysis]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { product_name, platform, seller, url, price, original_price, status, evidence } = req.body;
    const result = await pool.query(
      `UPDATE counterfeits SET product_name=$1, platform=$2, seller=$3, url=$4, price=$5, original_price=$6, status=$7, evidence=$8
       WHERE id=$9 RETURNING *`,
      [product_name || req.body.productName, platform, seller, url || req.body.productUrl, price, original_price || req.body.originalPrice, status, evidence, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM counterfeits WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/detect', async (req, res) => {
  try {
    const { productUrl, details } = req.body;
    const prompt = `Analyze this product listing for counterfeit indicators:\n\nProduct URL: ${productUrl}\nDetails: ${details || 'N/A'}\n\nProvide analysis on:\n1. Counterfeit Probability (percentage)\n2. Red Flag Indicators\n3. Price Analysis (vs authentic product)\n4. Seller Legitimacy Assessment\n5. Product Authenticity Markers\n6. Recommended Actions`;
    const systemPrompt = 'You are an expert in counterfeit product detection and brand protection. Analyze product listings for signs of counterfeiting with detailed evidence-based assessments.';
    const aiAnalysis = await callOpenRouter(prompt, systemPrompt);
    const result = await pool.query(
      `INSERT INTO counterfeits (product_name, url, status, ai_analysis) VALUES ('AI-Detected Product', $1, 'investigating', $2) RETURNING *`,
      [productUrl, aiAnalysis]
    );
    res.json({ ...result.rows[0], ai_analysis: aiAnalysis });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
