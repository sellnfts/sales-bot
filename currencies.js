const currencies = {
  // ETH
  '0x0000000000000000000000000000000000000000': {
    name: 'ETH',
    symbol: 'Ξ',
    decimals: 18,
    threshold: 1,
  },
  // BLur pool
  '0x0000000000a39bb272e79075ade125fd351887ac': {
    name: 'WETH',
    symbol: 'WΞ',
    decimals: 18,
    threshold: 1,
  },
  // WETH
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': {
    name: 'WETH',
    symbol: 'WΞ',
    decimals: 18,
    threshold: 1,
  },
  // DAI
  '0x6b175474e89094c44da98b954eedeac495271d0f': {
    name: 'DAI',
    symbol: 'DAI',
    decimals: 18,
    threshold: 1000,
  },
  // USDC
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 6,
    threshold: 1000,
  },
};

module.exports = {
  currencies: currencies,
};