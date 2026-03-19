// Utility functions used across the project

// Check if a string is a valid BSC/ETH address
const isValidAddress = (address) => {
  return address && address.startsWith('0x') && address.length === 42;
};

// Shorten address for display: 0x1234...5678
const shortenAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Convert risk score to color for frontend
const getRiskColor = (score) => {
  if (score >= 70) return 'red';
  if (score >= 40) return 'orange';
  return 'green';
};

module.exports = { isValidAddress, shortenAddress, getRiskColor };
