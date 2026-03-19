const { getTokenInfo, getTokenHolders, getContractSource } = require('../services/bscscanService');
const { getTokenPairData } = require('../services/dexscreenerService');
const { calculateTokenRisk } = require('../risk/riskEngine');
const db = require('../models/database');

const analyzeToken = async (req, res) => {
  try {
    const { address } = req.params;

    // Basic validation — BSC addresses always start with 0x and are 42 chars
    if (!address || address.length !== 42 || !address.startsWith('0x')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid token address. Must start with 0x and be 42 characters.'
      });
    }

    // Check if we already scanned this token in the last 10 minutes
    // This saves API calls and speeds up repeated searches
    const cached = db.prepare(`
      SELECT * FROM token_scans 
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
          tokenName: cached.token_name,
          tokenSymbol: cached.token_symbol,
          riskScore: cached.risk_score,
          warnings: JSON.parse(cached.warnings),
          safetyScore: 100 - cached.risk_score
        }
      });
    }

    // Fetch all data in parallel — faster than one by one
    const [tokenInfo, holders, contractData, pairData] = await Promise.all([
      getTokenInfo(address),
      getTokenHolders(address),
      getContractSource(address),
      getTokenPairData(address)
    ]);

    // Extract contract source code from BSCScan response
    const contractSource = contractData?.[0]?.SourceCode || null;

    // Extract liquidity from DexScreener response
    const liquidity = pairData?.liquidity || null;

    // Run the risk engine with all collected data
    const riskResult = calculateTokenRisk({
      holders: holders || [],
      liquidity,
      contractSource
    });

    // Get token name and symbol from BSCScan response
    const tokenName = pairData?.name || tokenInfo?.[0]?.tokenName || 'Unknown Token';
    const tokenSymbol = pairData?.symbol || tokenInfo?.[0]?.symbol || 'UNKNOWN';

    // Save result to database for caching and history
    db.prepare(`
      INSERT INTO token_scans (address, risk_score, warnings, token_name, token_symbol)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      address.toLowerCase(),
      riskResult.riskScore,
      JSON.stringify(riskResult.warnings),
      tokenName,
      tokenSymbol
    );

    // Send response back to frontend
    return res.json({
      success: true,
      cached: false,
      data: {
        address,
        tokenName,
        tokenSymbol,
        riskScore: riskResult.riskScore,
        riskLevel: riskResult.riskLevel,
        safetyScore: riskResult.safetyScore,
        warnings: riskResult.warnings,
        liquidity: pairData?.liquidity || 0,
        volume24h: pairData?.volume24h || 0,
        priceUsd: pairData?.priceUsd || 0
      }
    });

  } catch (error) {
    console.error('analyzeToken error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to analyze token. Please try again.'
    });
  }
};

module.exports = { analyzeToken };