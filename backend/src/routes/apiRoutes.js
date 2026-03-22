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

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;