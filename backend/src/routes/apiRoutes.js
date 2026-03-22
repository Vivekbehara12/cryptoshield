const express = require('express');
const router = express.Router();
const { analyzeToken } = require('../controllers/tokenController');
const { analyzeWallet } = require('../controllers/walletController');

router.get('/analyze-token/:address', analyzeToken);
router.get('/analyze-wallet/:address', analyzeWallet);

// New — scan history endpoint
router.get('/history', (req, res) => {
  try {
    const db = require('../models/database');

    const tokenScans = db.prepare(`
      SELECT address, token_name, token_symbol, risk_score, warnings, scanned_at
      FROM token_scans
      ORDER BY scanned_at DESC
      LIMIT 20
    `).all();

    const walletScans = db.prepare(`
      SELECT address, reputation_score, tokens_created, warnings, scanned_at
      FROM wallet_scans
      ORDER BY scanned_at DESC
      LIMIT 20
    `).all();

    return res.json({
      success: true,
      data: {
        tokenScans: tokenScans.map(s => ({
          ...s,
          warnings: JSON.parse(s.warnings || '[]'),
          riskLevel: s.risk_score >= 70 ? 'HIGH RISK' : s.risk_score >= 40 ? 'MEDIUM RISK' : 'LOW RISK',
          safetyScore: 100 - s.risk_score
        })),
        walletScans: walletScans.map(s => ({
          ...s,
          warnings: JSON.parse(s.warnings || '[]'),
          riskLevel: s.reputation_score >= 70 ? 'HIGH RISK' : s.reputation_score >= 40 ? 'MEDIUM RISK' : 'LOW RISK'
        }))
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch history' });
  }
});

router.post('/ai-summary', async (req, res) => {
  try {
    const { tokenData } = req.body;
    if (!tokenData) return res.status(400).json({ success: false, error: 'No token data provided' });

    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are a crypto risk analyst. Analyze this token and give a clear 3-4 sentence summary a non-technical user can understand. Be direct about whether they should invest or avoid.

Token: ${tokenData.tokenName} (${tokenData.tokenSymbol})
Safety Score: ${tokenData.safetyScore}/100
Risk Level: ${tokenData.riskLevel}
Liquidity: $${Number(tokenData.liquidity || 0).toLocaleString()}
24h Volume: $${Number(tokenData.volume24h || 0).toLocaleString()}
Price: $${tokenData.priceUsd}
Warnings: ${tokenData.warnings?.join(', ') || 'None'}

Give a plain English risk summary. Start with overall verdict, explain key risks, then give a clear recommendation.`
      }]
    });

    return res.json({
      success: true,
      summary: message.content[0].text
    });
  } catch (error) {
  console.error('AI summary error:', error.message);
  console.error('Full error:', JSON.stringify(error));
  return res.status(500).json({ 
    success: false, 
    error: 'Failed to generate AI summary',
    details: error.message 
  });
  }
});

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;