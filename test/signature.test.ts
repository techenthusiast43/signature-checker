import { describe, it, expect } from 'vitest';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import {
  generateNonce,
  buildTypedData,
  buildEip191MessageString,
  parseVerificationMessage,
  calculateMessageHash,
  verifySignatureLocally,
  type VerificationMessageData,
} from '../src/utils/signature';

describe('Signature Verification Engine', () => {
  // Generate a test wallet
  const testPrivateKey = generatePrivateKey();
  const account = privateKeyToAccount(testPrivateKey);
  const testWallet = account.address;
  const testChainId = 968; // BOT Chain Testnet

  it('generates unique cryptographic nonces', () => {
    const nonce1 = generateNonce();
    const nonce2 = generateNonce();
    expect(nonce1).not.toBe(nonce2);
    expect(nonce1.length).toBeGreaterThanOrEqual(16);
  });

  describe('EIP-712 Structured Typed Data', () => {
    it('signs and verifies a valid EIP-712 message', async () => {
      const now = Math.floor(Date.now() / 1000);
      const data: VerificationMessageData = {
        wallet: testWallet,
        statement: 'I hereby verify ownership and control of this EVM wallet on BOT Chain.',
        nonce: generateNonce(),
        issuedAt: now,
        expiresAt: now + 3600, // 1 hour validity
        chainId: testChainId,
      };

      const typedData = buildTypedData(data);
      const signature = await account.signTypedData({
        domain: typedData.domain,
        types: typedData.types,
        primaryType: typedData.primaryType,
        message: typedData.message,
      });

      const rawJson = JSON.stringify(
        {
          domain: {
            ...typedData.domain,
            chainId: Number(typedData.domain.chainId),
          },
          message: {
            ...typedData.message,
            issuedAt: Number(typedData.message.issuedAt),
            expiresAt: Number(typedData.message.expiresAt),
          },
        },
        null,
        2
      );

      const result = await verifySignatureLocally({
        claimedAddress: testWallet,
        rawMessage: rawJson,
        signature,
        signatureType: 'eip712',
      });

      expect(result.isValid).toBe(true);
      expect(result.addressMatches).toBe(true);
      expect(result.recoveredSigner?.toLowerCase()).toBe(testWallet.toLowerCase());
      expect(result.isExpired).toBe(false);
      expect(result.hasValidNonce).toBe(true);
    });

    it('rejects an expired EIP-712 signature', async () => {
      const pastTime = Math.floor(Date.now() / 1000) - 7200; // 2 hours ago
      const expiredData: VerificationMessageData = {
        wallet: testWallet,
        statement: 'Test statement',
        nonce: generateNonce(),
        issuedAt: pastTime - 3600,
        expiresAt: pastTime, // Expired
        chainId: testChainId,
      };

      const typedData = buildTypedData(expiredData);
      const signature = await account.signTypedData({
        domain: typedData.domain,
        types: typedData.types,
        primaryType: typedData.primaryType,
        message: typedData.message,
      });

      const rawJson = JSON.stringify(
        {
          domain: { ...typedData.domain, chainId: Number(typedData.domain.chainId) },
          message: {
            ...typedData.message,
            issuedAt: Number(typedData.message.issuedAt),
            expiresAt: Number(typedData.message.expiresAt),
          },
        },
        null,
        2
      );

      const result = await verifySignatureLocally({
        claimedAddress: testWallet,
        rawMessage: rawJson,
        signature,
        signatureType: 'eip712',
      });

      expect(result.isValid).toBe(false);
      expect(result.isExpired).toBe(true);
      expect(result.errorMessage).toContain('expired');
    });

    it('detects mismatched claimed address', async () => {
      const now = Math.floor(Date.now() / 1000);
      const data: VerificationMessageData = {
        wallet: testWallet,
        statement: 'Test statement',
        nonce: generateNonce(),
        issuedAt: now,
        expiresAt: now + 3600,
        chainId: testChainId,
      };

      const typedData = buildTypedData(data);
      const signature = await account.signTypedData({
        domain: typedData.domain,
        types: typedData.types,
        primaryType: typedData.primaryType,
        message: typedData.message,
      });

      const imposterWallet = '0x1111111111111111111111111111111111111111';

      const result = await verifySignatureLocally({
        claimedAddress: imposterWallet,
        rawMessage: JSON.stringify({
          domain: { ...typedData.domain, chainId: Number(typedData.domain.chainId) },
          message: {
            ...typedData.message,
            issuedAt: Number(typedData.message.issuedAt),
            expiresAt: Number(typedData.message.expiresAt),
          },
        }),
        signature,
        signatureType: 'eip712',
      });

      expect(result.isValid).toBe(false);
      expect(result.addressMatches).toBe(false);
      expect(result.errorMessage).toContain('does not match claimed address');
    });
  });

  describe('EIP-191 Personal Sign', () => {
    it('signs and verifies a valid EIP-191 text message', async () => {
      const now = Math.floor(Date.now() / 1000);
      const data: VerificationMessageData = {
        wallet: testWallet,
        statement: 'Ownership check on BOT Chain Bohr Testnet',
        nonce: generateNonce(),
        issuedAt: now,
        expiresAt: now + 3600,
        chainId: testChainId,
      };

      const messageText = buildEip191MessageString(data);
      const signature = await account.signMessage({ message: messageText });

      const result = await verifySignatureLocally({
        claimedAddress: testWallet,
        rawMessage: messageText,
        signature,
        signatureType: 'eip191',
      });

      expect(result.isValid).toBe(true);
      expect(result.addressMatches).toBe(true);
      expect(result.recoveredSigner?.toLowerCase()).toBe(testWallet.toLowerCase());
      expect(result.isExpired).toBe(false);
      expect(result.hasValidNonce).toBe(true);
    });

    it('rejects tampered EIP-191 message content', async () => {
      const now = Math.floor(Date.now() / 1000);
      const data: VerificationMessageData = {
        wallet: testWallet,
        statement: 'Original text',
        nonce: generateNonce(),
        issuedAt: now,
        expiresAt: now + 3600,
        chainId: testChainId,
      };

      const originalMessage = buildEip191MessageString(data);
      const signature = await account.signMessage({ message: originalMessage });

      const tamperedMessage = originalMessage.replace('Original text', 'Tampered malicious text');

      const result = await verifySignatureLocally({
        claimedAddress: testWallet,
        rawMessage: tamperedMessage,
        signature,
        signatureType: 'eip191',
      });

      expect(result.isValid).toBe(false);
      expect(result.addressMatches).toBe(false);
    });
  });

  describe('Message Parsing & Hash Computation', () => {
    it('parses formatted EIP-191 text lines accurately', () => {
      const data: VerificationMessageData = {
        wallet: testWallet,
        statement: 'Parsing verification test',
        nonce: 'abc123nonce456',
        issuedAt: 1700000000,
        expiresAt: 1700003600,
        chainId: 968,
      };

      const text = buildEip191MessageString(data);
      const parsed = parseVerificationMessage(text);

      expect(parsed.detectedType).toBe('eip191');
      expect(parsed.parsedData.wallet?.toLowerCase()).toBe(testWallet.toLowerCase());
      expect(parsed.parsedData.statement).toBe('Parsing verification test');
      expect(parsed.parsedData.nonce).toBe('abc123nonce456');
      expect(parsed.parsedData.issuedAt).toBe(1700000000);
      expect(parsed.parsedData.expiresAt).toBe(1700003600);
      expect(parsed.parsedData.chainId).toBe(968);
    });

    it('computes deterministic message hashes', () => {
      const data: VerificationMessageData = {
        wallet: testWallet,
        statement: 'Hash consistency test',
        nonce: 'nonce-hash-test',
        issuedAt: 1700000000,
        expiresAt: 1700003600,
        chainId: 968,
      };

      const hash1 = calculateMessageHash('eip712', data);
      const hash2 = calculateMessageHash('eip712', data);
      expect(hash1).toBe(hash2);
      expect(hash1.startsWith('0x')).toBe(true);
      expect(hash1.length).toBe(66);
    });
  });
});

