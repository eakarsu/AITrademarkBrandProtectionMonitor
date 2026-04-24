const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { callOpenRouter } = require('../services/openrouter');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM marketplace_listings ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM marketplace_listings WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/', async (req, res) => {
  try {
    const { marketplace, product_title, seller, price, url, status, is_counterfeit, trademark_matched } = req.body;
    const result = await pool.query(
      `INSERT INTO marketplace_listings (marketplace, product_title, seller, price, url, status, is_counterfeit, trademark_matched)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [marketplace, product_title || req.body.productTitle, seller, price, url, status || 'active', is_counterfeit || req.body.isCounterfeit || false, trademark_matched || req.body.trademarkMatched]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { marketplace, product_title, seller, price, url, status, is_counterfeit, trademark_matched } = req.body;
    const result = await pool.query(
      `UPDATE marketplace_listings SET marketplace=$1, product_title=$2, seller=$3, price=$4, url=$5, status=$6, is_counterfeit=$7, trademark_matched=$8
       WHERE id=$9 RETURNING *`,
      [marketplace, product_title || req.body.productTitle, seller, price, url, status, is_counterfeit || req.body.isCounterfeit, trademark_matched || req.body.trademarkMatched, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM marketplace_listings WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/analyze', async (req, res) => {
  try {
    const { productTitle, seller, marketplace, price } = req.body;
    const prompt = `Analyze this marketplace listing for potential trademark violations and counterfeit indicators:\n\nProduct: "${productTitle}"\nSeller: ${seller || 'Unknown'}\nMarketplace: ${marketplace || 'Unknown'}\nPrice: $${price || 'N/A'}\n\nProvide:\n1. Counterfeit Risk Score (0-100%)\n2. Trademark Violation Assessment\n3. Pricing Anomaly Analysis\n4. Seller Credibility Indicators\n5. Product Authenticity Red Flags\n6. Marketplace Compliance Issues\n7. Recommended Enforcement Actions\n8. Priority Level (low/medium/high/critical)`;
    const systemPrompt = 'You are an e-commerce brand protection specialist. Analyze marketplace listings for trademark violations, counterfeit products, and unauthorized selling. Provide detailed enforcement recommendations.';
    const aiAnalysis = await callOpenRouter(prompt, systemPrompt);
    res.json({ ai_analysis: aiAnalysis });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
