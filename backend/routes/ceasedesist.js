const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { callOpenRouter, parseAIJson } = require('../services/openrouter');
const PDFDocument = require('pdfkit');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cease_desist_letters ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cease_desist_letters WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/', async (req, res) => {
  try {
    const { recipient_name, recipient_email, trademark, infringement_type, status, letter_content } = req.body;
    const result = await pool.query(
      `INSERT INTO cease_desist_letters (recipient_name, recipient_email, trademark, infringement_type, status, letter_content, ai_generated)
       VALUES ($1,$2,$3,$4,$5,$6,false) RETURNING *`,
      [recipient_name || req.body.recipientName, recipient_email || req.body.recipientEmail, trademark, infringement_type || req.body.infringementType, status || 'draft', letter_content || req.body.letterContent]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { recipient_name, recipient_email, trademark, infringement_type, status, letter_content } = req.body;
    const result = await pool.query(
      `UPDATE cease_desist_letters SET recipient_name=$1, recipient_email=$2, trademark=$3, infringement_type=$4, status=$5, letter_content=$6
       WHERE id=$7 RETURNING *`,
      [recipient_name || req.body.recipientName, recipient_email || req.body.recipientEmail, trademark, infringement_type || req.body.infringementType, status, letter_content || req.body.letterContent, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM cease_desist_letters WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/generate', async (req, res) => {
  try {
    const { recipientName, recipientEmail, trademark, infringementType } = req.body;
    const prompt = `Generate a professional cease and desist letter with the following details:\n\nRecipient: ${recipientName}\nRecipient Email: ${recipientEmail || 'N/A'}\nTrademark Being Infringed: ${trademark}\nType of Infringement: ${infringementType}\n\nGenerate a formal, legally-sound cease and desist letter that:\n1. Clearly identifies the trademark owner's rights\n2. Describes the infringing activity\n3. Demands immediate cessation of infringing activities\n4. Sets a reasonable deadline for compliance\n5. Outlines consequences of non-compliance\n6. Maintains a professional but firm tone`;
    const systemPrompt = 'You are an experienced intellectual property attorney. Generate professional, legally-sound cease and desist letters that are firm but appropriate. Format the letter properly with date, addresses, subject line, body paragraphs, and signature block.';
    const letterContent = await callOpenRouter(prompt, systemPrompt);
    const result = await pool.query(
      `INSERT INTO cease_desist_letters (recipient_name, recipient_email, trademark, infringement_type, status, letter_content, ai_generated)
       VALUES ($1,$2,$3,$4,'draft',$5,true) RETURNING *`,
      [recipientName, recipientEmail, trademark, infringementType, letterContent]
    );
    res.json({ ...result.rows[0], letter_content: letterContent });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// GET /api/cease-desist/:id/generate-pdf
router.get('/:id/generate-pdf', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cease_desist_letters WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Letter not found' });
    const letter = result.rows[0];

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="cease-desist-${letter.id}.pdf"`);
    doc.pipe(res);

    // Header
    doc.fontSize(18).font('Helvetica-Bold').text('CEASE AND DESIST NOTICE', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).font('Helvetica').text(`Case Reference: CD-${String(letter.id).padStart(4, '0')}`, { align: 'right' });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
    doc.moveDown();

    // Recipient
    doc.fontSize(12).font('Helvetica-Bold').text('TO:');
    doc.font('Helvetica').fontSize(11).text(letter.recipient_name || 'Recipient');
    if (letter.recipient_email) doc.text(letter.recipient_email);
    doc.moveDown();

    // Subject
    doc.fontSize(12).font('Helvetica-Bold').text('RE: Infringement of Trademark Rights');
    doc.font('Helvetica').fontSize(10).text(`Trademark: ${letter.trademark}`);
    doc.text(`Type: ${letter.infringement_type}`);
    doc.moveDown();

    // Body
    doc.fontSize(11).font('Helvetica').text(letter.letter_content || 'Letter content not available.', { lineGap: 4 });
    doc.moveDown(2);

    // Signature block
    doc.font('Helvetica-Bold').text('Sincerely,');
    doc.font('Helvetica').text('\n\n_________________________');
    doc.text('Authorized Representative');
    doc.text('Date: ___________________');

    doc.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
