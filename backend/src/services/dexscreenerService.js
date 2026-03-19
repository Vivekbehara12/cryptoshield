const axios = require('axios');

const getTokenPairData = async (tokenAddress) => {
  try {
    const response = await axios.get(
      `https://api.dexscreener.com/tokens/v1/bsc/${tokenAddress}`
    );

    const pairs = response.data;
    if (!pairs || pairs.length === 0) return null;

    const pair = pairs[0];

    return {
        liquidity: pair.liquidity?.usd || 0,
        volume24h: pair.volume?.h24 || 0,
        priceUsd: pair.priceUsd || 0,
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