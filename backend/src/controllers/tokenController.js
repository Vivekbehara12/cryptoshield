const { getTokenInfo, getTokenHolders, getContractSource } = require('../services/bscscanService');
const { getTokenPairData } = require('../services/dexscreenerService');
const { calculateTokenRisk } = require('../risk/riskEngine');
const db = require('../models/database');

const analyzeToken = async (req, res) => {
  try {
    const { address } = req.params;

    if (!address || address.length !== 42 || !address.startsWith('0x')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid token address. Must start with 0x and be 42 characters.'
      });
    }

    // Check cache — only use if data is complete (no zeros)
    const cached = db.prepare(`
      SELECT * FROM token_scans
      WHERE address = ?
      AND datetime(scanned_at) > datetime('now', '-10 minutes')
      ORDER BY scanned_at DESC LIMIT 1
    `).get(address.toLowerCase());

    if (cached) {
      const cachedWarnings = JSON.parse(cached.warnings || '[]');
      // Only use cache if we have real data
      const hasValidData = cached.risk_score > 0 || cachedWarnings.length > 0;

      if (hasValidData) {
        return res.json({
          success: true,
          cached: true,
          data: {
            address,
            tokenName: cached.token_name,
            tokenSymbol: cached.token_symbol,
            riskScore: cached.risk_score,
            riskLevel: cached.risk_score >= 70 ? 'HIGH RISK' : cached.risk_score >= 40 ? 'MEDIUM RISK' : 'LOW RISK',
            safetyScore: 100 - cached.risk_score,
            warnings: cachedWarnings,
            liquidity: cached.liquidity || 0,
            volume24h: cached.volume24h || 0,
            priceUsd: cached.price_usd || 0
          }
        });
      }
      console.log('Cached data incomplete — fetching fresh data');
    }

    // Fetch all data in parallel
    const [tokenInfo, holders, contractData, pairData] = await Promise.all([
      getTokenInfo(address),
      getTokenHolders(address),
      getContractSource(address),
      getTokenPairData(address)
    ]);

    const contractSource = contractData?.[0]?.SourceCode || null;
    const liquidity = pairData?.liquidity || 0;
    const volume24h = pairData?.volume24h || 0;
    const priceUsd = pairData?.priceUsd || 0;

    const riskResult = calculateTokenRisk({
      holders: holders || [],
      liquidity,
      contractSource
    });

    const tokenName = pairData?.name || tokenInfo?.[0]?.tokenName || 'Unknown Token';
    const tokenSymbol = pairData?.symbol || tokenInfo?.[0]?.symbol || 'UNKNOWN';

    // Only cache if we got real data from at least one source
    const hasRealData = liquidity > 0 || priceUsd > 0 || riskResult.riskScore > 0;

    if (hasRealData) {
      // Delete old cached entry for this address first
      db.prepare(`DELETE FROM token_scans WHERE address = ?`).run(address.toLowerCase());

      // Insert fresh data
      db.prepare(`
        INSERT INTO token_scans (address, risk_score, warnings, token_name, token_symbol, liquidity, volume24h, price_usd)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        address.toLowerCase(),
        riskResult.riskScore,
        JSON.stringify(riskResult.warnings),
        tokenName,
        tokenSymbol,
        liquidity,
        volume24h,
        priceUsd
      );
    } else {
      console.log('No real data received — skipping cache');
    }

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
        liquidity,
        volume24h,
        priceUsd
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