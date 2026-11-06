import artifact from './SignatureRegistry.json';
import deployed from './deployedAddress.json';
import type { Address } from 'viem';

export const SIGNATURE_REGISTRY_ABI = artifact.abi;
export const SIGNATURE_REGISTRY_BYTECODE = artifact.bytecode as `0x${string}`;

export const DEFAULT_REGISTRY_ADDRESS: Address = deployed.address as Address;
