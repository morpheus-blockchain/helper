const { aggregate } = require('@makerdao/multicall');

const chainId = '1';

const pairAddress = {
  '1': '0xb1b5dada5795f174f1f62ede70edb4365fb07fb1',
  '3': '0x7986da5bfb1a8d16e599b3ab5d694b4f4754ba81',
}

const nodeUrls = {
  '1': 'https://gwan-ssl.wandevs.org:46891',
  '3': 'https://gwan-ssl.wandevs.org:46891'
};

const pairAddress = {
  '1': '0xb1b5dada5795f174f1f62ede70edb4365fb07fb1',
  '3': '0x7986da5bfb1a8d16e599b3ab5d694b4f4754ba81',
}

const multiCallAddr = {
  '1': '0xBa5934Ab3056fcA1Fa458D30FBB3810c3eb5145f',
  '3': '0x14095a721Dddb892D6350a777c75396D634A7d97',
}

const config = {
  rpcUrl: nodeUrls[chainId],
  multicallAddress: multiCallAddr[chainId],
}

const getSwapPrice = async () => {
  const calls = [
    {
      target: pairAddress[chainId],
      call: ['getReserves()(uint112,uint112,uint32)'],
      returns: [['_reserve0'], ['_reserve1'], ['_blockTimestampLast']]
    },
    {
      target: pairAddress[chainId],
      call: ['token0()(address)'],
      returns: [['token0']]
    },
    {
      target: pairAddress[chainId],
      call: ['token1()(address)'],
      returns: [['token1']]
    },
  ];

  // get reserve
  let ret = await aggregate(calls, config);

  // get token
  let ret2 = await aggregate([
    {
      target: ret.results.transformed.token0,
      call: ['symbol()(string)'],
      returns: [['token0Symbol']]
    },
    {
      target: ret.results.transformed.token1,
      call: ['symbol()(string)'],
      returns: [['token1Symbol']]
    },
  ], config);

  // get balance
  let ret3 = await aggregate([
    {
      target: ret.results.transformed.token0,
      call: ['balanceOf(address)(uint256)', walletAddress],
      returns: [['token0Balance', val => val / (ret2.results.transformed.token0Symbol === wanTokenSymbol ? 10 ** swapTokenDecimals : 10 ** 18)]]
    },
    {
      target: ret.results.transformed.token1,
      call: ['balanceOf(address)(uint256)', walletAddress],
      returns: [['token1Balance', val => val / (ret2.results.transformed.token1Symbol === wanTokenSymbol ? 10 ** swapTokenDecimals : 10 ** 18)]]
    },
  ], config);

  tokens = {
    '0': {
      symbol: ret2.results.transformed.token0Symbol,
      address: ret.results.transformed.token0,
      reserve: ret.results.transformed._reserve0 / (ret2.results.transformed.token0Symbol === wanTokenSymbol ? 10 ** swapTokenDecimals : 10 ** 18),
      balance: ret3.results.transformed.token0Balance,
    },
    '1': {
      symbol: ret2.results.transformed.token1Symbol,
      address: ret.results.transformed.token1,
      reserve: ret.results.transformed._reserve1 / (ret2.results.transformed.token1Symbol === wanTokenSymbol ? 10 ** swapTokenDecimals : 10 ** 18),
      balance: ret3.results.transformed.token1Balance,
    }
  };

  blockNumber = tmpNum;
  print('blockNumber', blockNumber);
  ret.results.transformed.price = tokens[0].symbol === wanTokenSymbol ? (tokens[0].reserve * (1 - fee / 100) / tokens[1].reserve) : (tokens[1].reserve * (1 - fee / 100) / tokens[0].reserve);

  return { ...ret.results.transformed, tokens };
}
