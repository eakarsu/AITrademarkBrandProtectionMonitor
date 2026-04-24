const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { callOpenRouter } = require('../services/openrouter');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM social_mentions ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM social_mentions WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/', async (req, res) => {
  try {
    const { platform, author, content, url, sentiment, reach, engagement, trademark_mentioned } = req.body;
    const result = await pool.query(
      `INSERT INTO social_mentions (platform, author, content, url, sentiment, reach, engagement, trademark_mentioned)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [platform, author, content, url, sentiment || 'neutral', reach, engagement, trademark_mentioned || req.body.brandMentioned]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { platform, author, content, url, sentiment, reach, engagement, trademark_mentioned } = req.body;
    const result = await pool.query(
      `UPDATE social_mentions SET platform=$1, author=$2, content=$3, url=$4, sentiment=$5, reach=$6, engagement=$7, trademark_mentioned=$8
       WHERE id=$9 RETURNING *`,
      [platform, author, content, url, sentiment, reach, engagement, trademark_mentioned || req.body.brandMentioned, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM social_mentions WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/analyze', async (req, res) => {
  try {
    const { brandName, platform, content } = req.body;
    const prompt = `Analyze this social media mention for brand protection concerns:\n\nBrand: "${brandName}"\nPlatform: ${platform || 'Unknown'}\nContent: "${content || 'N/A'}"\n\nProvide:\n1. Threat Level Assessment (low/medium/high/critical)\n2. Sentiment Analysis (positive/neutral/negative)\n3. Brand Impact Score (0-100)\n4. Potential Risks Identified\n5. Audience Reach Estimation\n6. Virality Risk Assessment\n7. Recommended Response Strategy\n8. Escalation Recommendations`;
    const systemPrompt = 'You are a social media brand protection specialist. Analyze social media mentions for potential brand threats, reputation risks, and provide actionable response strategies.';
    const aiAnalysis = await callOpenRouter(prompt, systemPrompt);
    res.json({ ai_analysis: aiAnalysis });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
