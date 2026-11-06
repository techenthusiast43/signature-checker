import {
  hashTypedData,
  hashMessage,
  recoverTypedDataAddress,
  recoverMessageAddress,
  isAddress,
  getAddress,
  type Address,
  type Hex,
  type PublicClient,
} from 'viem';

export const SIGNATURE_DOMAIN_NAME = 'SignatureCheck';
export const SIGNATURE_DOMAIN_VERSION = '1';
export const DEFAULT_STATEMENT =
  'I hereby verify ownership and control of this EVM wallet on BOT Chain.';

export interface VerificationMessageData {
  wallet: Address;
  statement: string;
  nonce: string;
  issuedAt: number; // Unix timestamp in seconds
  expiresAt: number; // Unix timestamp in seconds
  chainId: number;
}

export type SignatureType = 'eip712' | 'eip191';

export const EIP712_TYPES = {
  VerificationRequest: [
    { name: 'wallet', type: 'address' },
    { name: 'statement', type: 'string' },
    { name: 'nonce', type: 'string' },
    { name: 'issuedAt', type: 'uint256' },
    { name: 'expiresAt', type: 'uint256' },
  ],
} as const;

export const ERC1271_ABI = [
  {
    type: 'function',
    name: 'isValidSignature',
    stateMutability: 'view',
    inputs: [
      { name: 'hash', type: 'bytes32' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [{ name: 'magicValue', type: 'bytes4' }],
  },
] as const;

export const ERC1271_MAGIC_VALUE = '0x1626ba7e';

/**
 * Generate a cryptographically secure random 128-bit hex nonce.
 */
export function generateNonce(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Constructs standard EIP-712 Domain object.
 */
export function getEip712Domain(chainId: number, verifyingContract?: Address) {
  return {
    name: SIGNATURE_DOMAIN_NAME,
    version: SIGNATURE_DOMAIN_VERSION,
    chainId: BigInt(chainId),
    ...(verifyingContract && isAddress(verifyingContract)
      ? { verifyingContract }
      : {}),
  };
}

/**
 * Prepares the typed data structure for signing and hashing.
 */
export function buildTypedData(
  data: VerificationMessageData,
  verifyingContract?: Address
) {
  const domain = getEip712Domain(data.chainId, verifyingContract);
  const message = {
    wallet: getAddress(data.wallet),
    statement: data.statement,
    nonce: data.nonce,
    issuedAt: BigInt(data.issuedAt),
    expiresAt: BigInt(data.expiresAt),
  };

  return {
    domain,
    types: EIP712_TYPES,
    primaryType: 'VerificationRequest' as const,
    message,
  };
}

/**
 * Builds standard EIP-191 plain text formatted string.
 */
export function buildEip191MessageString(data: VerificationMessageData): string {
  return [
    `[SignatureCheck Ownership Verification]`,
    `Domain: ${SIGNATURE_DOMAIN_NAME} v${SIGNATURE_DOMAIN_VERSION}`,
    `Chain ID: ${data.chainId}`,
    `Wallet: ${getAddress(data.wallet)}`,
    `Statement: ${data.statement}`,
    `Nonce: ${data.nonce}`,
    `Issued At: ${new Date(data.issuedAt * 1000).toISOString()} (${data.issuedAt})`,
    `Expires At: ${new Date(data.expiresAt * 1000).toISOString()} (${data.expiresAt})`,
  ].join('\n');
}

/**
 * Parses an EIP-191 message string or JSON structure to extract verification parameters.
 */
export function parseVerificationMessage(
  rawInput: string
): {
  parsedData: Partial<VerificationMessageData>;
  detectedType: SignatureType;
  rawString: string;
} {
  const trimmed = rawInput.trim();

  // Try JSON parsing first (EIP-712 or serialized object)
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const obj = JSON.parse(trimmed);
      if (obj.message && obj.domain) {
        // Full EIP-712 structure
        return {
          parsedData: {
            wallet: obj.message.wallet ? getAddress(obj.message.wallet) : undefined,
            statement: obj.message.statement,
            nonce: obj.message.nonce,
            issuedAt: Number(obj.message.issuedAt),
            expiresAt: Number(obj.message.expiresAt),
            chainId: Number(obj.domain.chainId),
          },
          detectedType: 'eip712',
          rawString: trimmed,
        };
      }
      if (obj.wallet) {
        return {
          parsedData: {
            wallet: isAddress(obj.wallet) ? getAddress(obj.wallet) : undefined,
            statement: obj.statement,
            nonce: obj.nonce,
            issuedAt: Number(obj.issuedAt),
            expiresAt: Number(obj.expiresAt),
            chainId: Number(obj.chainId),
          },
          detectedType: 'eip712',
          rawString: trimmed,
        };
      }
    } catch {
      // Continue to text parsing
    }
  }

  // Parse key-value lines from EIP-191 text
  const lines = trimmed.split('\n');
  const extracted: Partial<VerificationMessageData> = {};

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim().toLowerCase();
      const val = line.slice(colonIndex + 1).trim();

      if (key === 'chain id') extracted.chainId = Number(val);
      if (key === 'wallet' && isAddress(val)) extracted.wallet = getAddress(val);
      if (key === 'statement') extracted.statement = val;
      if (key === 'nonce') extracted.nonce = val;
      if (key === 'issued at') {
        const match = val.match(/\((\d+)\)/);
        if (match) extracted.issuedAt = Number(match[1]);
        else if (!isNaN(Date.parse(val))) extracted.issuedAt = Math.floor(new Date(val).getTime() / 1000);
      }
      if (key === 'expires at') {
        const match = val.match(/\((\d+)\)/);
        if (match) extracted.expiresAt = Number(match[1]);
        else if (!isNaN(Date.parse(val))) extracted.expiresAt = Math.floor(new Date(val).getTime() / 1000);
      }
    }
  }

  return {
    parsedData: extracted,
    detectedType: 'eip191',
    rawString: trimmed,
  };
}

/**
 * Calculates cryptographic message hash for on-chain registration or off-chain checking.
 */
export function calculateMessageHash(
  type: SignatureType,
  data: VerificationMessageData,
  rawMessageString?: string,
  verifyingContract?: Address
): Hex {
  if (type === 'eip712') {
    const typedData = buildTypedData(data, verifyingContract);
    return hashTypedData({
      domain: typedData.domain,
      types: typedData.types,
      primaryType: typedData.primaryType,
      message: typedData.message,
    });
  } else {
    const msg = rawMessageString || buildEip191MessageString(data);
    return hashMessage(msg);
  }
}

export interface VerificationResult {
  isValid: boolean;
  signatureType: SignatureType;
  recoveredSigner: Address | null;
  claimedAddress: Address;
  addressMatches: boolean;
  isExpired: boolean;
  expiryDate: Date | null;
  hasValidNonce: boolean;
  isContractWallet: boolean;
  erc1271Verified?: boolean;
  messageHash: Hex;
  errorMessage?: string;
}

/**
 * Comprehensive verification engine supporting:
 * - EIP-712 Typed Data recovery
 * - EIP-191 Personal Sign recovery
 * - Expiry timestamp validation
 * - Nonce presence validation
 * - Address matching
 * - ERC-1271 Smart Contract signature validation via publicClient
 */
export async function verifySignatureLocally(params: {
  claimedAddress: string;
  rawMessage: string;
  signature: string;
  signatureType?: SignatureType;
  publicClient?: PublicClient;
  verifyingContract?: Address;
}): Promise<VerificationResult> {
  const { claimedAddress, rawMessage, signature, verifyingContract } = params;

  if (!isAddress(claimedAddress)) {
    throw new Error('Claimed address is not a valid EVM address.');
  }
  const normalizedClaimed = getAddress(claimedAddress);

  const formattedSig = (signature.trim().startsWith('0x')
    ? signature.trim()
    : `0x${signature.trim()}`) as Hex;

  // Determine type and parse content
  const parsed = parseVerificationMessage(rawMessage);
  const signatureType = params.signatureType || parsed.detectedType;

  const nowSec = Math.floor(Date.now() / 1000);
  const expiresAt = parsed.parsedData.expiresAt;
  const isExpired = expiresAt !== undefined ? expiresAt <= nowSec : false;
  const expiryDate = expiresAt !== undefined ? new Date(expiresAt * 1000) : null;
  const hasValidNonce = Boolean(parsed.parsedData.nonce && parsed.parsedData.nonce.length >= 8);

  let recoveredSigner: Address | null = null;
  let messageHash: Hex;
  let isContractWallet = false;
  let erc1271Verified = false;

  try {
    if (signatureType === 'eip712') {
      const fullData: VerificationMessageData = {
        wallet: normalizedClaimed,
        statement: parsed.parsedData.statement || DEFAULT_STATEMENT,
        nonce: parsed.parsedData.nonce || '',
        issuedAt: parsed.parsedData.issuedAt || nowSec,
        expiresAt: parsed.parsedData.expiresAt || nowSec + 86400,
        chainId: parsed.parsedData.chainId || 968,
      };

      const typedData = buildTypedData(fullData, verifyingContract);
      messageHash = calculateMessageHash('eip712', fullData, undefined, verifyingContract);

      try {
        recoveredSigner = await recoverTypedDataAddress({
          domain: typedData.domain,
          types: typedData.types,
          primaryType: typedData.primaryType,
          message: typedData.message,
          signature: formattedSig,
        });
      } catch (recoverErr) {
        // Might be a contract wallet signature
      }
    } else {
      // EIP-191
      messageHash = hashMessage(rawMessage.trim());
      try {
        recoveredSigner = await recoverMessageAddress({
          message: rawMessage.trim(),
          signature: formattedSig,
        });
      } catch (recoverErr) {
        // Might be a contract wallet signature
      }
    }

    // Check ERC-1271 contract wallet if publicClient provided
    if (params.publicClient) {
      try {
        const bytecode = await params.publicClient.getBytecode({ address: normalizedClaimed });
        if (bytecode && bytecode !== '0x') {
          isContractWallet = true;
          const magicValue = await params.publicClient.readContract({
            address: normalizedClaimed,
            abi: ERC1271_ABI,
            functionName: 'isValidSignature',
            args: [messageHash, formattedSig],
          });
          erc1271Verified = magicValue === ERC1271_MAGIC_VALUE;
        }
      } catch (contractErr) {
        // Not a contract or contract does not implement isValidSignature
      }
    }

    const addressMatches = Boolean(
      (recoveredSigner && getAddress(recoveredSigner) === normalizedClaimed) ||
      erc1271Verified
    );

    const isValid = addressMatches && !isExpired;

    let errorMessage: string | undefined;
    if (isExpired) {
      errorMessage = `Signature expired on ${expiryDate?.toLocaleString()}`;
    } else if (!addressMatches) {
      errorMessage = recoveredSigner
        ? `Recovered address (${recoveredSigner}) does not match claimed address (${normalizedClaimed})`
        : 'Could not recover valid signer address from signature.';
    }

    return {
      isValid,
      signatureType,
      recoveredSigner: recoveredSigner ? getAddress(recoveredSigner) : null,
      claimedAddress: normalizedClaimed,
      addressMatches,
      isExpired,
      expiryDate,
      hasValidNonce,
      isContractWallet,
      erc1271Verified,
      messageHash,
      errorMessage,
    };
  } catch (err: any) {
    return {
      isValid: false,
      signatureType,
      recoveredSigner: null,
      claimedAddress: normalizedClaimed,
      addressMatches: false,
      isExpired,
      expiryDate,
      hasValidNonce,
      isContractWallet,
      messageHash: '0x' as Hex,
      errorMessage: err?.message || 'Verification failed due to invalid signature formatting.',
    };
  }
}

