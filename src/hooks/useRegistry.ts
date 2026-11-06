import { useState, useEffect } from 'react';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from 'wagmi';
import { type Address, type Hex, isAddress } from 'viem';
import { SIGNATURE_REGISTRY_ABI, DEFAULT_REGISTRY_ADDRESS } from '../contracts';

const STORAGE_KEY = 'signature_check_registry_address';

export interface VerificationRecordState {
  messageHash: Hex;
  timestamp: number;
  isActive: boolean;
}

export function useRegistry(overrideAddress?: Address) {
  const { address: connectedWallet } = useAccount();
  const publicClient = usePublicClient();

  // Custom registry address from localStorage or default
  const [registryAddress, setRegistryAddressState] = useState<Address>(() => {
    if (overrideAddress && isAddress(overrideAddress)) return overrideAddress;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isAddress(stored)) return stored as Address;
    return DEFAULT_REGISTRY_ADDRESS;
  });

  const updateRegistryAddress = (newAddr: string) => {
    if (isAddress(newAddr)) {
      setRegistryAddressState(newAddr as Address);
      localStorage.setItem(STORAGE_KEY, newAddr);
    }
  };

  const resetRegistryAddress = () => {
    setRegistryAddressState(DEFAULT_REGISTRY_ADDRESS);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Read connected wallet verification
  const {
    data: connectedRecordData,
    isLoading: isLoadingConnectedRecord,
    refetch: refetchConnectedRecord,
    error: readRecordError,
  } = useReadContract({
    address: registryAddress,
    abi: SIGNATURE_REGISTRY_ABI,
    functionName: 'getVerification',
    args: connectedWallet ? [connectedWallet] : undefined,
    query: {
      enabled: Boolean(connectedWallet && isAddress(registryAddress)),
    },
  });

  // Read connected wallet isVerified
  const {
    data: isConnectedVerified,
    isLoading: isLoadingIsVerified,
    refetch: refetchIsVerified,
  } = useReadContract({
    address: registryAddress,
    abi: SIGNATURE_REGISTRY_ABI,
    functionName: 'isVerified',
    args: connectedWallet ? [connectedWallet] : undefined,
    query: {
      enabled: Boolean(connectedWallet && isAddress(registryAddress)),
    },
  });

  // Write contract actions
  const {
    writeContractAsync,
    data: txHash,
    isPending: isSubmittingTx,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  // Wait for tx confirmation
  const {
    isLoading: isConfirmingTx,
    isSuccess: isTxSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Refetch records on confirmation
  useEffect(() => {
    if (isTxSuccess) {
      refetchConnectedRecord();
      refetchIsVerified();
    }
  }, [isTxSuccess, refetchConnectedRecord, refetchIsVerified]);

  const registerVerification = async (messageHash: Hex) => {
    resetWrite();
    return await writeContractAsync({
      address: registryAddress,
      abi: SIGNATURE_REGISTRY_ABI,
      functionName: 'registerVerification',
      args: [messageHash],
    });
  };

  const revokeVerification = async () => {
    resetWrite();
    return await writeContractAsync({
      address: registryAddress,
      abi: SIGNATURE_REGISTRY_ABI,
      functionName: 'revokeVerification',
    });
  };

  // Query arbitrary wallet on-chain record
  const fetchWalletRecord = async (
    targetWallet: Address
  ): Promise<VerificationRecordState | null> => {
    if (!publicClient || !isAddress(targetWallet)) return null;
    try {
      const result = await publicClient.readContract({
        address: registryAddress,
        abi: SIGNATURE_REGISTRY_ABI,
        functionName: 'getVerification',
        args: [targetWallet],
      });

      if (Array.isArray(result) && result.length >= 3) {
        return {
          messageHash: result[0] as Hex,
          timestamp: Number(result[1]),
          isActive: Boolean(result[2]),
        };
      }
      return null;
    } catch (err) {
      console.error('Error fetching wallet record:', err);
      throw err;
    }
  };

  const connectedRecord: VerificationRecordState | null =
    connectedRecordData && Array.isArray(connectedRecordData)
      ? {
          messageHash: connectedRecordData[0] as Hex,
          timestamp: Number(connectedRecordData[1]),
          isActive: Boolean(connectedRecordData[2]),
        }
      : null;

  return {
    registryAddress,
    updateRegistryAddress,
    resetRegistryAddress,
    connectedRecord,
    isConnectedVerified: Boolean(isConnectedVerified),
    isLoadingConnectedRecord: isLoadingConnectedRecord || isLoadingIsVerified,
    refetchConnectedRecord,
    registerVerification,
    revokeVerification,
    fetchWalletRecord,
    txHash,
    isSubmittingTx,
    isConfirmingTx,
    isTxSuccess,
    writeError: writeError || receiptError || readRecordError,
  };
}

