const express = require('express');
const router = express.Router();

const { analyzeToken } = require('../controllers/tokenController');
const { analyzeWallet } = require('../controllers/walletController');

// When frontend calls GET /api/analyze-token/0xABC123, it runs analyzeToken
router.get('/analyze-token/:address', analyzeToken);

// When frontend calls GET /api/analyze-wallet/0xABC123, it runs analyzeWallet
router.get('/analyze-wallet/:address', analyzeWallet);

// Health check route — useful for testing
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;