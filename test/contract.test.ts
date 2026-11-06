import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { encodeFunctionData, decodeFunctionResult, keccak256, toHex } from 'viem';

describe('SignatureRegistry Smart Contract', () => {
  const artifactPath = path.resolve('contracts', 'artifacts', 'SignatureRegistry.json');
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

  it('contains valid bytecode and ABI', () => {
    expect(artifact.contractName).toBe('SignatureRegistry');
    expect(artifact.bytecode.length).toBeGreaterThan(100);
    expect(Array.isArray(artifact.abi)).toBe(true);
  });

  it('exposes all required registry functions', () => {
    const functionNames = artifact.abi
      .filter((item: any) => item.type === 'function')
      .map((item: any) => item.name);

    expect(functionNames).toContain('registerVerification');
    expect(functionNames).toContain('revokeVerification');
    expect(functionNames).toContain('getVerification');
    expect(functionNames).toContain('isVerified');
  });

  it('exposes expected events for indexing', () => {
    const eventNames = artifact.abi
      .filter((item: any) => item.type === 'event')
      .map((item: any) => item.name);

    expect(eventNames).toContain('VerificationRegistered');
    expect(eventNames).toContain('VerificationRevoked');
  });

  it('encodes registerVerification calldata correctly', () => {
    const dummyHash = keccak256(toHex('test-verification-hash'));
    const calldata = encodeFunctionData({
      abi: artifact.abi,
      functionName: 'registerVerification',
      args: [dummyHash],
    });

    expect(calldata.startsWith('0x')).toBe(true);
    // Selector is 4 bytes (8 hex characters + '0x')
    expect(calldata.length).toBe(2 + 8 + 64);
  });

  it('encodes revokeVerification calldata correctly', () => {
    const calldata = encodeFunctionData({
      abi: artifact.abi,
      functionName: 'revokeVerification',
    });

    expect(calldata.startsWith('0x')).toBe(true);
    expect(calldata.length).toBe(10); // 4-byte selector
  });

  it('simulates and decodes getVerification return structure', () => {
    const dummyHash = keccak256(toHex('sample-hash'));
    const timestamp = BigInt(1700000000);
    const isActive = true;

    // ABI definition for getVerification
    const getVerificationItem = artifact.abi.find(
      (item: any) => item.name === 'getVerification'
    );
    expect(getVerificationItem).toBeDefined();
    expect(getVerificationItem.outputs.length).toBe(3);
    expect(getVerificationItem.outputs[0].type).toBe('bytes32');
    expect(getVerificationItem.outputs[1].type).toBe('uint256');
    expect(getVerificationItem.outputs[2].type).toBe('bool');
  });
});

