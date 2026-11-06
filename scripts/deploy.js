import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import fs from 'node:fs';
import path from 'node:path';

// Load compiled artifact
const artifactPath = path.resolve('contracts', 'artifacts', 'SignatureRegistry.json');
const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

// BOT Chain configurations
const networks = {
  testnet: {
    id: 968,
    name: 'BOT Chain Testnet (Bohr)',
    rpc: process.env.RPC_URL || 'https://rpc.bohr.life',
    explorer: 'https://scan.bohr.life',
    currency: 'BOT',
  },
  mainnet: {
    id: 677,
    name: 'BOT Chain Mainnet',
    rpc: process.env.RPC_URL || 'https://rpc.botchain.ai',
    explorer: 'https://scan.botchain.ai',
    currency: 'BOT',
  },
};

async function main() {
  const targetNetworkKey = process.env.NETWORK === 'mainnet' ? 'mainnet' : 'testnet';
  const network = networks[targetNetworkKey];

  console.log(`\n==============================================`);
  console.log(`Deploying SignatureRegistry to ${network.name}`);
  console.log(`Chain ID: ${network.id}`);
  console.log(`RPC URL:  ${network.rpc}`);
  console.log(`Explorer: ${network.explorer}`);
  console.log(`==============================================\n`);

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error('ERROR: PRIVATE_KEY environment variable is required to deploy.');
    console.log('Usage example:');
    console.log('  $env:PRIVATE_KEY="0x..."; $env:NETWORK="testnet"; node scripts/deploy.js');
    process.exit(1);
  }

  const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
  const account = privateKeyToAccount(formattedKey);

  console.log(`Deployer Address: ${account.address}`);

  const chainDefinition = {
    id: network.id,
    name: network.name,
    nativeCurrency: { name: 'BOT', symbol: network.currency, decimals: 18 },
    rpcUrls: {
      default: { http: [network.rpc] },
    },
    blockExplorers: {
      default: { name: 'BOTScan', url: network.explorer },
    },
  };

  const publicClient = createPublicClient({
    chain: chainDefinition,
    transport: http(network.rpc),
  });

  const walletClient = createWalletClient({
    account,
    chain: chainDefinition,
    transport: http(network.rpc),
  });

  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`Deployer Balance: ${Number(balance) / 1e18} ${network.currency}`);

  if (balance === 0n) {
    console.warn(`WARNING: Deployer account has 0 ${network.currency}. Please fund this wallet before deploying.`);
  }

  console.log('Broadcasting contract deployment transaction...');

  const hash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
  });

  console.log(`Deployment Transaction Hash: ${hash}`);
  console.log(`Check transaction at: ${network.explorer}/tx/${hash}`);
  console.log('Waiting for receipt...');

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  if (receipt.status === 'success' && receipt.contractAddress) {
    console.log(`\n SUCCESS! Contract deployed to: ${receipt.contractAddress}`);
    console.log(`Explorer link: ${network.explorer}/address/${receipt.contractAddress}`);

    // Update frontend config with deployed address
    const deployedConfig = {
      address: receipt.contractAddress,
      chainId: network.id,
      networkName: network.name,
      deployedAt: new Date().toISOString(),
      transactionHash: hash,
      explorerUrl: `${network.explorer}/address/${receipt.contractAddress}`,
    };

    const configPath = path.resolve('src', 'contracts', 'deployedAddress.json');
    fs.writeFileSync(configPath, JSON.stringify(deployedConfig, null, 2));
    console.log(`Updated frontend deployedAddress config at: ${configPath}`);
  } else {
    console.error('Deployment transaction failed or reverted.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Deployment error:', err);
  process.exit(1);
});

