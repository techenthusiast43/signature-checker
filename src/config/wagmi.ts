import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { botChainTestnet, botChainMainnet } from './chains';

// 1. Get ProjectId from environment or use a default standard ID for development
export const projectId =
  (import.meta.env.VITE_REOWN_PROJECT_ID as string) ||
  'a30fbf02a45d06fb9d2a6a815a5fbc40';

// 2. Define networks
export const networks = [botChainTestnet, botChainMainnet] as const;

// 3. Create Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  networks: [botChainTestnet, botChainMainnet],
  projectId,
  ssr: false,
});

// 4. Create AppKit modal instance
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks: [botChainTestnet, botChainMainnet],
  defaultNetwork: botChainTestnet,
  projectId,
  metadata: {
    name: 'SignatureCheck',
    description: 'Decentralized EVM Wallet Ownership Verification on BOT Chain',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://signaturecheck.botchain.ai',
    icons: ['https://scan.bohr.life/favicon.ico'],
  },
  themeMode: 'dark',
  features: {
    analytics: false,
    email: false,
    socials: [],
  },
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;

