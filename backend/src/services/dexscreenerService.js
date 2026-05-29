const axios = require('axios');

const getTokenPairData = async (tokenAddress) => {
  try {
    const response = await axios.get(
      `https://api.dexscreener.com/tokens/v1/bsc/${tokenAddress}`
    );

    const pairs = response.data;
    if (!pairs || pairs.length === 0) return null;

    const pair = pairs.sort((a, b) =>
      (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
    )[0];

    const liquidity = pair.liquidity?.usd || 0;
    const volume24h = pair.volume?.h24 || 0;
    const priceUsd = pair.priceUsd || 0;

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

const getTokenOHLCV = async (tokenAddress, timeframe = '1h') => {
  try {
    const pairsResponse = await axios.get(
      `https://api.dexscreener.com/tokens/v1/bsc/${tokenAddress}`,
      { timeout: 8000 }
    );

    const pairs = pairsResponse.data;
    if (!pairs || pairs.length === 0) return null;

    const pair = pairs.sort((a, b) =>
      (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
    )[0];

    if (!pair) return null;

    const baseSymbol = pair.baseToken?.symbol?.toUpperCase();
    const quoteSymbol = pair.quoteToken?.symbol?.toUpperCase();

    const intervalMap = { '1h': '1h', '4h': '4h', '1d': '1d' };
    const limitMap = { '1h': 48, '4h': 42, '1d': 30 };
    const interval = intervalMap[timeframe] || '1h';
    const limit = limitMap[timeframe] || 48;

    // Stablecoins that are quote currencies on Binance
    const stablecoins = ['USDT', 'BUSD', 'USDC', 'DAI', 'TUSD'];
    const isBaseStable = stablecoins.includes(baseSymbol);

    // Build list of pairs to try
    let pairsToTry = [];

    if (isBaseStable) {
      // For stablecoins use quote token as base
      pairsToTry = [
        `${quoteSymbol}${baseSymbol}`,
        `${quoteSymbol}USDT`,
        `${quoteSymbol}BUSD`,
        `${baseSymbol}USDC`,
      ];
    } else {
      pairsToTry = [
        `${baseSymbol}USDT`,
        `${baseSymbol}BUSD`,
        `${baseSymbol}BNB`,
        `${baseSymbol}BTC`,
        `${baseSymbol}ETH`,
      ];
    }

    let klines = null;
    let usedPair = '';

    for (const binancePair of pairsToTry) {
      try {
        console.log(`Trying Binance pair: ${binancePair}`);
        const res = await axios.get('https://api.binance.com/api/v3/klines', {
          params: { symbol: binancePair, interval, limit },
          timeout: 6000
        });
        if (res.data && res.data.length > 0) {
          klines = res.data;
          usedPair = binancePair;
          console.log(`Found data for: ${binancePair}`);
          break;
        }
      } catch (e) {
        console.log(`${binancePair} not found`);
      }
    }

    if (!klines || klines.length === 0) {
      console.log(`No Binance data found for ${baseSymbol}`);
      return null;
    }

    const formatted = {
      t: klines.map(k => Math.floor(Number(k[0]) / 1000)),
      o: klines.map(k => parseFloat(k[1])),
      h: klines.map(k => parseFloat(k[2])),
      l: klines.map(k => parseFloat(k[3])),
      c: klines.map(k => parseFloat(k[4]))
    };

    return {
      pairAddress: pair.pairAddress,
      pairName: usedPair,
      ohlcv: formatted
    };

  } catch (error) {
    console.error('OHLCV error:', error.message);
    return null;
  }
};

module.exports = { getTokenPairData, getTokenOHLCV };