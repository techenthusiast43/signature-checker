import { defineChain } from 'viem';

/**
 * Official BOT Chain Testnet (Bohr) Configuration
 * Chain ID: 968 (0x3C8)
 * RPC: https://rpc.bohr.life
 * Native Token: BOT (150M Total Supply)
 * Explorer: https://scan.bohr.life
 */
export const botChainTestnet = defineChain({
  id: 968,
  name: 'BOT Chain Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'BOT',
    symbol: 'BOT',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.bohr.life'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BOTScan Testnet',
      url: 'https://scan.bohr.life',
    },
  },
  testnet: true,
});

/**
 * Official BOT Chain Mainnet Configuration
 * Chain ID: 677 (0x2A5)
 * RPC: https://rpc.botchain.ai
 * Native Token: BOT
 * Explorer: https://scan.botchain.ai
 */
export const botChainMainnet = defineChain({
  id: 677,
  name: 'BOT Chain',
  nativeCurrency: {
    decimals: 18,
    name: 'BOT',
    symbol: 'BOT',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.botchain.ai'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BOTScan',
      url: 'https://scan.botchain.ai',
    },
  },
  testnet: false,
});

export const DEFAULT_CHAIN = botChainTestnet;

