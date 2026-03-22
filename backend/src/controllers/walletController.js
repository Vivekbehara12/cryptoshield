const { getWalletTransactions } = require('../services/bscscanService');
const { calculateWalletReputation } = require('../risk/riskEngine');
const db = require('../models/database');

const analyzeWallet = async (req, res) => {
  try {
    const { address } = req.params;

    if (!address || address.length !== 42 || !address.startsWith('0x')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address. Must start with 0x and be 42 characters.'
      });
    }

    // Check cache
    const cached = db.prepare(`
      SELECT * FROM wallet_scans
      WHERE address = ?
      AND datetime(scanned_at) > datetime('now', '-10 minutes')
      ORDER BY scanned_at DESC LIMIT 1
    `).get(address.toLowerCase());

    if (cached) {
      const cachedWarnings = JSON.parse(cached.warnings || '[]');
      const hasZeroData = cached.tokens_created === 0 && cachedWarnings.length === 0;

      if (!hasZeroData) {
        return res.json({
          success: true,
          cached: true,
          data: {
            address,
            reputationScore: cached.reputation_score,
            riskLevel: cached.reputation_score >= 70 ? 'HIGH RISK' : cached.reputation_score >= 40 ? 'MEDIUM RISK' : 'LOW RISK',
            tokensCreated: cached.tokens_created,
            warnings: cachedWarnings,
            safetyScore: 100 - cached.reputation_score
          }
        });
      }
      console.log('Cached wallet data has zeros — fetching fresh');
    }

    const transactions = await getWalletTransactions(address);

    const reputationResult = calculateWalletReputation({
      transactions: transactions || []
    });

    const tokensCreated = (transactions || []).filter(
      tx => tx.to === '' || tx.to === null
    ).length;

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