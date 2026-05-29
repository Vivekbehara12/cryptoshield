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
      WHERE id IN (
        SELECT MAX(id) FROM token_scans GROUP BY address
      )
      ORDER BY scanned_at DESC
      LIMIT 50
    `).all();

    const walletScans = db.prepare(`
      SELECT address, reputation_score, tokens_created, warnings, scanned_at
      FROM wallet_scans
      WHERE id IN (
        SELECT MAX(id) FROM wallet_scans GROUP BY address
      )
      ORDER BY scanned_at DESC
      LIMIT 50
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

    const Groq = require('groq-sdk');
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 200,
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

Give a plain English risk summary in 3-4 sentences only.`
      }]
    });

    const summary = completion.choices[0]?.message?.content || 'Could not generate summary.';
    return res.json({ success: true, summary });

  } catch (error) {
    console.error('AI summary error:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to generate summary' });
  }
});


router.get('/token-chart/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { timeframe = '1h' } = req.query;
    const { getTokenOHLCV } = require('../services/dexscreenerService');

    const chartData = await getTokenOHLCV(address, timeframe);

    if (!chartData) {
      return res.json({ success: false, error: 'No chart data available for this token' });
    }

    return res.json({ success: true, data: chartData });
  } catch (error) {
    console.error('Chart error:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch chart data' });
  }
});


router.post('/ai-alternatives', async (req, res) => {
  try {
    const { tokenData } = req.body;
    if (!tokenData) return res.status(400).json({ success: false, error: 'No token data' });

    const Groq = require('groq-sdk');
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `You are a crypto investment advisor. Based on this token analysis, suggest 3 alternative BSC tokens.

Token analyzed: ${tokenData.tokenName} (${tokenData.tokenSymbol})
Safety Score: ${tokenData.safetyScore}/100
Risk Level: ${tokenData.riskLevel}
Liquidity: $${Number(tokenData.liquidity || 0).toLocaleString()}
Warnings: ${tokenData.warnings?.join(', ') || 'None'}

Rules:
- If HIGH RISK token: suggest 3 much safer alternatives
- If LOW RISK token: suggest 3 similar tokens with good reputation
- Only suggest well known BSC tokens: BNB, CAKE, USDT, BUSD, ETH, BTCB, ADA, DOT, LINK, UNI, AAVE
- For each token give: name, symbol, BSC contract address, one line reason why it is better or similar
- Respond in this exact JSON format only, no other text:
{
  "alternatives": [
    {
      "name": "Token Name",
      "symbol": "SYMBOL",
      "address": "0x...",
      "reason": "One line reason",
      "riskLevel": "LOW RISK"
    }
  ]
}`
      }]
    });

    const text = completion.choices[0]?.message?.content || '';

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.json({ success: false, error: 'Could not parse alternatives' });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return res.json({ success: true, alternatives: parsed.alternatives });

  } catch (error) {
    console.error('AI alternatives error:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to generate alternatives' });
  }
});

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;