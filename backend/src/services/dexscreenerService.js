const axios = require('axios');

const getTokenPairData = async (tokenAddress) => {
  try {
    // Try new API format first
    const response = await axios.get(
      `https://api.dexscreener.com/tokens/v1/bsc/${tokenAddress}`,
      { timeout: 8000 }
    );

    let pairs = response.data;

    // Handle both array and object response formats
    if (pairs && pairs.pairs) pairs = pairs.pairs;
    if (!Array.isArray(pairs)) pairs = [pairs];
    if (!pairs || pairs.length === 0 || !pairs[0]) return null;

    // Find the pair with highest liquidity
    const pair = pairs.sort((a, b) => 
      (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
    )[0];

    const liquidity = pair.liquidity?.usd || 0;
    const volume24h = pair.volume?.h24 || 0;
    const priceUsd = pair.priceUsd || 0;

    // If all values are 0 return null so we don't cache bad data
    if (liquidity === 0 && volume24h === 0 && priceUsd === 0) return null;

    return {
      liquidity,
      volume24h,
      priceUsd,
      pairCreatedAt: pair.pairCreatedAt || null,
      dexId: pair.dexId || 'unknown',
      name: pair.baseToken?.name || null,
      symbol: pair.baseToken?.symbol || null
    };
  } catch (error) {
    console.error('DexScreener error:', error.message);
    return null;
  }
};

module.exports = { getTokenPairData };
