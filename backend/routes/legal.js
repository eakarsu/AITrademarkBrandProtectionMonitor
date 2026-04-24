const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { callOpenRouter } = require('../services/openrouter');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM legal_cases ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM legal_cases WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/', async (req, res) => {
  try {
    const { case_number, title, defendant, case_type, status, jurisdiction, filing_date, description, outcome, damages } = req.body;
    const result = await pool.query(
      `INSERT INTO legal_cases (case_number, title, defendant, case_type, status, jurisdiction, filing_date, description, outcome, damages)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [case_number || req.body.caseNumber, title, defendant, case_type || req.body.caseType, status || 'open', jurisdiction, filing_date || req.body.filingDate, description, outcome, damages]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { case_number, title, defendant, case_type, status, jurisdiction, filing_date, description, outcome, damages } = req.body;
    const result = await pool.query(
      `UPDATE legal_cases SET case_number=$1, title=$2, defendant=$3, case_type=$4, status=$5, jurisdiction=$6, filing_date=$7, description=$8, outcome=$9, damages=$10
       WHERE id=$11 RETURNING *`,
      [case_number || req.body.caseNumber, title, defendant, case_type || req.body.caseType, status, jurisdiction, filing_date || req.body.filingDate, description, outcome, damages, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM legal_cases WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/strategy', async (req, res) => {
  try {
    const { title, defendant, caseType, jurisdiction, description } = req.body;
    const prompt = `Develop a legal strategy for this trademark case:\n\nCase Title: "${title}"\nDefendant: ${defendant || 'Unknown'}\nCase Type: ${caseType || 'Infringement'}\nJurisdiction: ${jurisdiction || 'United States'}\nDescription: ${description || 'N/A'}\n\nProvide:\n1. Case Strength Assessment (weak/moderate/strong)\n2. Recommended Legal Approach\n3. Key Arguments to Present\n4. Evidence Needed\n5. Potential Damages Estimate Range\n6. Timeline Estimation\n7. Settlement vs Litigation Analysis\n8. Risk Factors\n9. Precedent Cases to Reference\n10. Recommended Next Steps`;
    const systemPrompt = 'You are a senior intellectual property litigation attorney. Provide strategic legal analysis for trademark cases with practical, actionable recommendations. Consider both litigation and settlement paths.';
    const aiAnalysis = await callOpenRouter(prompt, systemPrompt);
    res.json({ ai_analysis: aiAnalysis });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
