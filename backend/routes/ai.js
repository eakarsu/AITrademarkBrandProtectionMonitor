const express = require('express');
const router = express.Router();
const { callOpenRouter } = require('../services/openrouter');

// General-purpose AI brand protection assistant
router.post('/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    const prompt = `${context ? `Context: ${context}\n\n` : ''}User Question: ${message}`;
    const systemPrompt = `You are an expert AI assistant for the AI Trademark & Brand Protection Monitor platform. You specialize in:
- Trademark law and registration
- Brand protection strategies
- Intellectual property management
- Counterfeit detection
- Domain monitoring and cybersquatting
- Legal enforcement strategies
- Competitive brand intelligence
- Social media brand monitoring

Provide professional, actionable advice. Use clear formatting with headers and bullet points.`;
    const aiResponse = await callOpenRouter(prompt, systemPrompt);
    res.json({ response: aiResponse });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// AI Brand Health Check
router.post('/brand-health', async (req, res) => {
  try {
    const { brandName, industry } = req.body;
    const prompt = `Perform a comprehensive Brand Health Check:\n\nBrand: "${brandName}"\nIndustry: ${industry || 'General'}\n\nProvide a full assessment:\n1. Brand Strength Index (0-100)\n2. Trademark Protection Status Assessment\n3. Online Presence Analysis\n4. Counterfeit Vulnerability Score\n5. Domain Security Assessment\n6. Social Media Brand Safety\n7. Competitive Positioning\n8. Legal Protection Gaps\n9. Key Risk Areas\n10. Action Priority Matrix (immediate/short-term/long-term)\n11. Overall Brand Health Grade (A-F)`;
    const systemPrompt = 'You are a brand strategy consultant performing comprehensive brand health assessments. Provide detailed, data-driven analysis with actionable recommendations scored and prioritized.';
    const aiResponse = await callOpenRouter(prompt, systemPrompt);
    res.json({ response: aiResponse });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// AI Risk Scanner
router.post('/risk-scan', async (req, res) => {
  try {
    const { brandName, scanType } = req.body;
    const prompt = `Perform a ${scanType || 'comprehensive'} risk scan for brand "${brandName}":\n\nScan all potential threat vectors:\n1. Domain Squatting Risks\n2. Social Media Impersonation Risks\n3. Counterfeit Product Risks\n4. Trademark Dilution Risks\n5. Copyright Infringement Risks\n6. Phishing/Fraud Risks\n7. App Store Impersonation\n8. SEO/Ad Hijacking Risks\n9. Dark Web Exposure\n10. Supply Chain Risks\n\nFor each, provide:\n- Risk Level (low/medium/high/critical)\n- Specific Threats Found\n- Recommended Actions\n- Priority Rating`;
    const systemPrompt = 'You are a cybersecurity and brand protection risk analyst. Perform thorough risk scans identifying all potential threat vectors to a brand. Be specific about threats and prioritize actions.';
    const aiResponse = await callOpenRouter(prompt, systemPrompt);
    res.json({ response: aiResponse });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// AI Enforcement Advisor
router.post('/enforcement', async (req, res) => {
  try {
    const { violationType, platform, description } = req.body;
    const prompt = `Provide enforcement strategy for this brand violation:\n\nViolation Type: ${violationType || 'General'}\nPlatform: ${platform || 'Unknown'}\nDescription: ${description || 'N/A'}\n\nProvide:\n1. Enforcement Priority Assessment\n2. Platform-Specific Takedown Procedures\n3. Legal Options Available\n4. Evidence Collection Checklist\n5. Timeline for Action\n6. Cost-Benefit Analysis of Enforcement\n7. Escalation Path\n8. Documentation Requirements\n9. Success Probability Assessment\n10. Alternative Resolution Options`;
    const systemPrompt = 'You are a brand enforcement specialist with expertise in platform-specific takedown procedures, DMCA/UDRP processes, and intellectual property enforcement. Provide step-by-step enforcement guidance.';
    const aiResponse = await callOpenRouter(prompt, systemPrompt);
    res.json({ response: aiResponse });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
