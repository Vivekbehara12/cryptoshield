const calculateTokenRisk = (tokenData) => {
  let riskScore = 0;
  const warnings = [];

  const { holders, liquidity, contractSource } = tokenData;

  // ---- CHECK 1: Developer ownership (max 35 points) ----
  if (holders && holders.length > 0) {
    const topHolderPercent = parseFloat(holders[0]?.percentage || 0);
    if (topHolderPercent > 50) {
      riskScore += 35;
      warnings.push(`Top holder owns ${topHolderPercent.toFixed(1)}% — extreme concentration risk`);
    } else if (topHolderPercent > 30) {
      riskScore += 20;
      warnings.push(`Top holder owns ${topHolderPercent.toFixed(1)}% — high concentration`);
    } else if (topHolderPercent > 15) {
      riskScore += 10;
      warnings.push(`Top holder owns ${topHolderPercent.toFixed(1)}% — moderate concentration`);
    }
  } else {
    riskScore += 5;
  }

  // ---- CHECK 2: Liquidity (max 25 points) ----
  if (liquidity !== null && liquidity !== undefined) {
    if (liquidity < 1000) {
      riskScore += 25;
      warnings.push(`Extremely low liquidity $${liquidity.toFixed(0)} — rug pull very likely`);
    } else if (liquidity < 10000) {
      riskScore += 18;
      warnings.push(`Low liquidity $${liquidity.toFixed(0)} — high rug pull risk`);
    } else if (liquidity < 50000) {
      riskScore += 10;
      warnings.push(`Moderate liquidity $${liquidity.toFixed(0)} — some risk`);
    } else if (liquidity < 100000) {
      riskScore += 5;
    }
  } else {
    riskScore += 20;
    warnings.push('Liquidity data unavailable — token may not be listed');
  }

  // ---- CHECK 3: Smart contract analysis (max 40 points) ----
  if (contractSource && typeof contractSource === 'string') {
    const source = contractSource.toLowerCase();

    // Mint function — +15 points
    if (source.includes('function mint') || source.includes('_mint(')) {
      riskScore += 15;
      warnings.push('Contract has mint function — unlimited token creation possible');
    }

    // Blacklist function — +10 points
    if (source.includes('blacklist') || source.includes('_isblacklisted') || source.includes('addtoblacklist')) {
      riskScore += 10;
      warnings.push('Contract has blacklist function — developer can block wallets');
    }

    // Pause function — +8 points
    if (source.includes('whennotpaused') || (source.includes('pause') && source.includes('unpause'))) {
      riskScore += 8;
      warnings.push('Contract has pause function — trading can be halted');
    }

    // Hidden owner — +8 points
    if (source.includes('onlyowner') && source.includes('renounceownership') === false) {
      riskScore += 3;
    }

    // Max transaction limit — suspicious pattern +5 points
    if (source.includes('maxtxamount') || source.includes('_maxtxamount')) {
      riskScore += 5;
      warnings.push('Contract has max transaction limit — suspicious trading restriction');
    }

    // Fee manipulation — +5 points
    if (source.includes('settaxfee') || source.includes('setliquidityfee') || source.includes('_taxfee')) {
      riskScore += 5;
      warnings.push('Contract has adjustable fees — developer can change tax rates');
    }

    // Honeypot patterns — +10 points
    if (source.includes('cannotselltokens') || source.includes('_issell') || source.includes('antibot')) {
      riskScore += 10;
      warnings.push('Possible honeypot detected — contract may prevent selling');
    }

    // Self destruct — +10 points
    if (source.includes('selfdestruct') || source.includes('suicide(')) {
      riskScore += 10;
      warnings.push('Contract has self-destruct function — developer can destroy contract');
    }

    // Proxy pattern — moderate risk +5 points
    if (source.includes('delegatecall') || source.includes('upgradeable')) {
      riskScore += 5;
      warnings.push('Contract uses proxy pattern — logic can be changed after deployment');
    }

  } else {
    riskScore += 25;
    warnings.push('Contract source not verified — hidden code is a major red flag');
  }

  riskScore = Math.min(riskScore, 100);

  let riskLevel;
  if (riskScore >= 70) riskLevel = 'HIGH RISK';
  else if (riskScore >= 40) riskLevel = 'MEDIUM RISK';
  else riskLevel = 'LOW RISK';

  return {
    riskScore,
    riskLevel,
    warnings,
    safetyScore: 100 - riskScore
  };
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
