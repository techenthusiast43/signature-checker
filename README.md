# SignatureCheck — BOT Chain Decentralized Verification dApp

SignatureCheck is a production-grade decentralized application on **BOT Chain** that allows users to prove cryptographic control of an EVM wallet by signing a unique structured message. Third parties can independently verify the signature off-chain without fees, and signers can optionally record a timestamped verification record on the BOT Chain on-chain registry.

---

## Key Features

1. **EVM Wallet Connection**
   - Universal wallet connectivity powered by **Reown AppKit** (`@reown/appkit`, `@reown/appkit-adapter-wagmi`) and **Wagmi v2**.
   - Supports MetaMask, Rabby, Coinbase Wallet, Brave, TokenPocket, Bitget, and WalletConnect standard wallets.
   - Built-in network switcher for BOT Chain Testnet (Bohr) and BOT Chain Mainnet.

2. **Sign Message Panel**
   - **EIP-712 (Structured Typed Data)**: Human-readable signing with explicit domain separation, chain ID, and message typing.
   - **EIP-191 (`personal_sign`)**: Standard text verification message with line-by-line parameter breakdown.
   - **Replay Protection**: Auto-generates high-entropy cryptographic nonces.
   - **Configurable Expiry**: Preset durations (1 Hour, 24 Hours, 7 Days, 30 Days) with automated timestamp encoding.
   - **Zero-Gas Off-Chain Signing**: Standard cryptographic signing without triggering network transactions.
   - **Security Promise**: Never requests private keys or seed phrases.

3. **Independent Signature Verifier**
   - Pure client-side cryptographic address recovery using `viem`.
   - Compares recovered signer address against claimed wallet address.
   - Real-time validity checks:
     - Signature validity badge (Valid vs. Invalid)
     - Address match indicator
     - Expiration check against current wall-clock Unix time
     - Nonce validation
     - **ERC-1271 Smart Contract Wallet Support**: Queries `isValidSignature(bytes32,bytes)` on-chain for smart accounts (Safe, Argent, ERC-4337 accounts).
   - One-click transfer to inspect the on-chain registry for any recovered address.

4. **On-Chain Verification Registry (`SignatureRegistry.sol`)**
   - Deployed on **BOT Chain Bohr Testnet (Chain ID 968)** and **BOT Chain Mainnet (Chain ID 677)**.
   - Methods:
     - `registerVerification(bytes32 messageHash)`: Caller registers their own active verification record with timestamp.
     - `revokeVerification()`: Caller revokes their existing active record.
     - `getVerification(address wallet)`: View stored verification details (`messageHash`, `timestamp`, `isActive`).
     - `isVerified(address wallet)`: View boolean check whether an active record exists.
   - Emits indexable events: `VerificationRegistered` and `VerificationRevoked`.

5. **My Verifications**
   - Live query of the connected wallet's active on-chain record on BOT Chain.
   - Direct button to revoke active records or register new verification hashes.
   - Direct links to transactions and addresses on BOTScan.

6. **Public Verification Search**
   - Search any EVM address to inspect its current on-chain status on BOT Chain.
   - **Prominent Security Disclaimer**: Clearly explains that the on-chain record proves private key / wallet ownership at a timestamp, *not* a person's real-world legal identity or reputation.

---

## Official BOT Chain Network Specifications

Retrieved from official developer documentation:

| Parameter | BOT Chain Testnet (Bohr) | BOT Chain Mainnet |
| :--- | :--- | :--- |
| **Network Name** | BOT Chain Testnet | BOT Chain |
| **Chain ID** | `968` (`0x3c8`) | `677` (`0x2a5`) |
| **RPC URL** | `https://rpc.bohr.life` | `https://rpc.botchain.ai` |
| **Currency Symbol** | `BOT` (18 decimals) | `BOT` (18 decimals) |
| **Total Supply** | 150 Million BOT | 150 Million BOT |
| **Block Explorer** | [https://scan.bohr.life](https://scan.bohr.life) | [https://scan.botchain.ai](https://scan.botchain.ai) |

---

## Project Structure

```
signature check/
├── contracts/
│   ├── SignatureRegistry.sol      # Solidity smart contract
│   └── artifacts/
│       └── SignatureRegistry.json # Compiled ABI & Bytecode
├── scripts/
│   ├── compile.js                 # Solc compilation pipeline
│   └── deploy.js                  # Viem-based deployment script for BOT Chain
├── src/
│   ├── config/
│   │   ├── chains.ts              # BOT Chain Viem chain definitions
│   │   └── wagmi.ts               # Reown AppKit + Wagmi v2 config
│   ├── contracts/
│   │   ├── index.ts               # Typed contract constants & ABI
│   │   ├── SignatureRegistry.json # Frontend ABI artifact
│   │   └── deployedAddress.json   # Deployed registry address configuration
│   ├── hooks/
│   │   └── useRegistry.ts         # Wagmi hook for smart contract interactions
│   ├── utils/
│   │   └── signature.ts           # EIP-712, EIP-191 & ERC-1271 verification engine
│   ├── components/
│   │   ├── Header.tsx             # Navbar with AppKit connect & network selector
│   │   ├── SignPanel.tsx          # Message creation, nonces, & wallet signing
│   │   ├── VerifyPanel.tsx        # Local signature verifier & recovered signer
│   │   ├── MyVerificationsPanel.tsx # Connected wallet registry manager
│   │   ├── PublicVerifyPanel.tsx  # Address search & identity disclaimer
│   │   └── SettingsModal.tsx      # Registry address switcher & network parameters
│   ├── App.tsx                    # Main tabbed dApp shell
│   └── index.css                  # Tailwind CSS v4 styling
├── test/
│   ├── contract.test.ts           # Smart contract ABI & calldata tests
│   └── signature.test.ts          # Cryptographic signature verification tests
├── package.json
└── README.md
```

---

## Installation & Setup

### Prerequisites
- Node.js >= 20.x or 24.x
- npm >= 10.x

### 1. Install Dependencies
```bash
npm install
```

### 2. Compile Smart Contracts
```bash
npm run compile
# or: node scripts/compile.js
```
This compiles `contracts/SignatureRegistry.sol` using standard `solc` (0.8.20) and generates the artifacts in `contracts/artifacts/` and `src/contracts/`.

### 3. Run Test Suites
```bash
npm test
```
Runs all 14 unit tests:
- EIP-712 typed data signing and address recovery
- EIP-191 text message signing and address recovery
- Expiry detection and tampered message rejection
- Replay-protection nonce generation and validation
- Smart contract interface, calldata encoding, and return structure decoding

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Build for Production
```bash
npm run build
```

---

## Smart Contract Deployment to BOT Chain

To deploy the `SignatureRegistry` smart contract to BOT Chain:

### Deploy to BOT Chain Testnet (Bohr - Chain ID 968)
```powershell
$env:PRIVATE_KEY="your_deployer_private_key"
$env:NETWORK="testnet"
node scripts/deploy.js
```

### Deploy to BOT Chain Mainnet (Chain ID 677)
```powershell
$env:PRIVATE_KEY="your_deployer_private_key"
$env:NETWORK="mainnet"
node scripts/deploy.js
```

The deployment script:
1. Connects to the official BOT Chain RPC.
2. Deploys `SignatureRegistry.sol` using Viem.
3. Awaits transaction receipt.
4. Outputs the deployed address and BOTScan link.
5. Automatically updates `src/contracts/deployedAddress.json` for the frontend.

---

## Security Model & Guarantees

1. **Replay Protection**: Every verification message includes an active chain ID (968 or 677), domain name (`SignatureCheck`), application version (`1`), and a random 128-bit hex nonce. Signatures cannot be replayed on other chains or other domains.
2. **Time-Bound**: Every message carries an explicit `expiresAt` Unix timestamp. The verification engine marks any signature past its expiration as invalid.
3. **No Private Key Exposure**: The dApp interacts only through standard browser wallet providers (EIP-1193). No private keys or secret phrases are ever handled.
4. **On-Chain vs. Off-Chain Separation**: Verifying a signature is an off-chain cryptographic calculation that costs **zero gas**. Registering an on-chain verification record on BOT Chain is an explicit, optional transaction that timestamps the verification hash into the immutable ledger.
