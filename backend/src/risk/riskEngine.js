const calculateTokenRisk = (tokenData) => {
  let riskScore = 0;
  const warnings = [];

  const { holders, liquidity, contractSource } = tokenData;

  if (holders && holders.length > 0) {
    const topHolderPercent = parseFloat(holders[0]?.percentage || 0);
    if (topHolderPercent > 50) {
      riskScore += 35;
      warnings.push(`Top holder owns ${topHolderPercent.toFixed(1)}% — extreme risk`);
    } else if (topHolderPercent > 30) {
      riskScore += 20;
      warnings.push(`Top holder owns ${topHolderPercent.toFixed(1)}% — high concentration`);
    } else if (topHolderPercent > 15) {
      riskScore += 10;
      warnings.push(`Top holder owns ${topHolderPercent.toFixed(1)}% — moderate concentration`);
    }
  } else {
    riskScore += 10;
    warnings.push('Holder data unavailable');
  }

  if (liquidity !== null && liquidity !== undefined) {
    if (liquidity < 1000) {
      riskScore += 30;
      warnings.push(`Extremely low liquidity $${liquidity} — rug pull likely`);
    } else if (liquidity < 10000) {
      riskScore += 20;
      warnings.push(`Low liquidity $${liquidity} — high risk`);
    } else if (liquidity < 50000) {
      riskScore += 10;
      warnings.push(`Moderate liquidity $${liquidity}`);
    }
  } else {
    riskScore += 25;
    warnings.push('Liquidity data unavailable');
  }

  if (contractSource && typeof contractSource === 'string') {
    const source = contractSource.toLowerCase();
    if (source.includes('function mint') || source.includes('_mint(')) {
      riskScore += 15;
      warnings.push('Contract has mint function — unlimited token creation possible');
    }
    if (source.includes('blacklist') || source.includes('_isblacklisted')) {
      riskScore += 10;
      warnings.push('Contract has blacklist function — wallets can be blocked');
    }
    if (source.includes('pause') && source.includes('whennotpaused')) {
      riskScore += 10;
      warnings.push('Contract has pause function — trading can be halted');
    }
  } else {
    riskScore += 20;
    warnings.push('Contract source not verified — hidden code is a red flag');
  }

  riskScore = Math.min(riskScore, 100);

  let riskLevel;
  if (riskScore >= 70) riskLevel = 'HIGH RISK';
  else if (riskScore >= 40) riskLevel = 'MEDIUM RISK';
  else riskLevel = 'LOW RISK';

  return { riskScore, riskLevel, warnings, safetyScore: 100 - riskScore };
};

const calculateWalletReputation = (walletData) => {
  let riskScore = 0;
  const warnings = [];

  const { transactions } = walletData;

  if (!transactions || transactions.length === 0) {
    return {
      riskScore: 0,
      riskLevel: 'LOW RISK',
      warnings: ['No transaction history found'],
      safetyScore: 100
    };
  }

  const contractDeployments = transactions.filter(
    tx => tx.to === '' || tx.to === null
  );

  if (contractDeployments.length > 10) {
    riskScore += 50;
    warnings.push(`Wallet deployed ${contractDeployments.length} contracts — very suspicious`);
  } else if (contractDeployments.length > 5) {
    riskScore += 30;
    warnings.push(`Wallet deployed ${contractDeployments.length} contracts — suspicious`);
  } else if (contractDeployments.length > 2) {
    riskScore += 15;
    warnings.push(`Wallet deployed ${contractDeployments.length} contracts — moderate concern`);
  }

  if (transactions.length >= 50) {
    riskScore += 20;
    warnings.push('Very high transaction volume — possible bot activity');
  }

  riskScore = Math.min(riskScore, 100);

  let riskLevel;
  if (riskScore >= 70) riskLevel = 'HIGH RISK';
  else if (riskScore >= 40) riskLevel = 'MEDIUM RISK';
  else riskLevel = 'LOW RISK';

  return { riskScore, riskLevel, warnings, safetyScore: 100 - riskScore };
};

module.exports = { calculateTokenRisk, calculateWalletReputation };
