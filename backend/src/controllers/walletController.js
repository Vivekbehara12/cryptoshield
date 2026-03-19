const { getWalletTransactions } = require('../services/bscscanService');
const { calculateWalletReputation } = require('../risk/riskEngine');
const db = require('../models/database');

const analyzeWallet = async (req, res) => {
  try {
    const { address } = req.params;

    // Validate wallet address
    if (!address || address.length !== 42 || !address.startsWith('0x')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address. Must start with 0x and be 42 characters.'
      });
    }

    // Check cache first
    const cached = db.prepare(`
      SELECT * FROM wallet_scans
      WHERE address = ?
      AND datetime(scanned_at) > datetime('now', '-10 minutes')
      ORDER BY scanned_at DESC LIMIT 1
    `).get(address.toLowerCase());

    if (cached) {
      return res.json({
        success: true,
        cached: true,
        data: {
          address,
          reputationScore: cached.reputation_score,
          tokensCreated: cached.tokens_created,
          warnings: JSON.parse(cached.warnings),
          safetyScore: 100 - cached.reputation_score
        }
      });
    }

    // Fetch wallet transaction history from BSCScan
    const transactions = await getWalletTransactions(address);

    // Run wallet reputation engine
    const reputationResult = calculateWalletReputation({
      transactions: transactions || []
    });

    // Count contract deployments (tokens created by this wallet)
    const tokensCreated = (transactions || []).filter(
      tx => tx.to === '' || tx.to === null
    ).length;

    // Save to database
    db.prepare(`
      INSERT INTO wallet_scans (address, reputation_score, tokens_created, warnings)
      VALUES (?, ?, ?, ?)
    `).run(
      address.toLowerCase(),
      reputationResult.riskScore,
      tokensCreated,
      JSON.stringify(reputationResult.warnings)
    );

    return res.json({
      success: true,
      cached: false,
      data: {
        address,
        reputationScore: reputationResult.riskScore,
        riskLevel: reputationResult.riskLevel,
        safetyScore: reputationResult.safetyScore,
        tokensCreated,
        totalTransactions: (transactions || []).length,
        warnings: reputationResult.warnings
      }
    });

  } catch (error) {
    console.error('analyzeWallet error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to analyze wallet. Please try again.'
    });
  }
};

module.exports = { analyzeWallet };