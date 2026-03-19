
const axios = require('axios');

const BASE_URL = 'https://api.etherscan.io/v2/api';
const API_KEY = process.env.BSCSCAN_API_KEY;
const CHAIN_ID = 56; // 56 = BNB Smart Chain (BSC)

const getTokenInfo = async (tokenAddress) => {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        chainid: CHAIN_ID,
        module: 'token',
        action: 'tokeninfo',
        contractaddress: tokenAddress,
        apikey: API_KEY
      }
    });
    return response.data.result;
  } catch (error) {
    console.error('getTokenInfo error:', error.message);
    return null;
  }
};

const getTokenHolders = async (tokenAddress) => {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        chainid: CHAIN_ID,
        module: 'token',
        action: 'tokenholderlist',
        contractaddress: tokenAddress,
        page: 1,
        offset: 10,
        apikey: API_KEY
      }
    });
    return response.data.result;
  } catch (error) {
    console.error('getTokenHolders error:', error.message);
    return null;
  }
};

const getWalletTransactions = async (walletAddress) => {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        chainid: CHAIN_ID,
        module: 'account',
        action: 'txlist',
        address: walletAddress,
        startblock: 0,
        endblock: 99999999,
        sort: 'desc',
        page: 1,
        offset: 50,
        apikey: API_KEY
      }
    });
    return response.data.result;
  } catch (error) {
    console.error('getWalletTransactions error:', error.message);
    return null;
  }
};

const getContractSource = async (tokenAddress) => {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        chainid: CHAIN_ID,
        module: 'contract',
        action: 'getsourcecode',
        address: tokenAddress,
        apikey: API_KEY
      }
    });
    return response.data.result;
  } catch (error) {
    console.error('getContractSource error:', error.message);
    return null;
  }
};

module.exports = {
  getTokenInfo,
  getTokenHolders,
  getWalletTransactions,
  getContractSource
};
