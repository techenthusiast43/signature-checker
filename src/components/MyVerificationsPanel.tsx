import React, { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import {
  Layers,
  ShieldCheck,
  ShieldAlert,
  Clock,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  PlusCircle,
  AlertCircle,
  Wallet,
} from 'lucide-react';
import { useRegistry } from '../hooks/useRegistry';
import { botChainTestnet, botChainMainnet } from '../config/chains';
import type { Hex } from 'viem';

interface MyVerificationsPanelProps {
  onNavigateToSign: () => void;
}

export const MyVerificationsPanel: React.FC<MyVerificationsPanelProps> = ({
  onNavigateToSign,
}) => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { open } = useAppKit();

  const {
    registryAddress,
    connectedRecord,
    isConnectedVerified,
    isLoadingConnectedRecord,
    refetchConnectedRecord,
    registerVerification,
    revokeVerification,
    txHash,
    isSubmittingTx,
    isConfirmingTx,
    isTxSuccess,
    writeError,
  } = useRegistry();

  const [inputHash, setInputHash] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const explorerBase =
    chainId === botChainMainnet.id
      ? botChainMainnet.blockExplorers.default.url
      : botChainTestnet.blockExplorers.default.url;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleManualRegister = async () => {
    setActionError(null);
    if (!inputHash.trim().startsWith('0x') || inputHash.trim().length !== 66) {
      setActionError('Please provide a valid 32-byte hex hash (starts with 0x, 66 characters).');
      return;
    }

    try {
      await registerVerification(inputHash.trim() as Hex);
      setInputHash('');
    } catch (err: any) {
      console.error('Registration error:', err);
      setActionError(err?.shortMessage || err?.message || 'Failed to register verification.');
    }
  };

  const handleRevoke = async () => {
    setActionError(null);
    try {
      await revokeVerification();
    } catch (err: any) {
      console.error('Revocation error:', err);
      setActionError(err?.shortMessage || err?.message || 'Failed to revoke verification.');
    }
  };

  if (!isConnected || !address) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center space-y-4">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-cyan-950/50 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
          <Wallet className="h-8 w-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Connect Your EVM Wallet</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">
            Connect your wallet to inspect your on-chain verification registry status and manage your records on BOT Chain.
          </p>
        </div>
        <button
          type="button"
          onClick={() => open()}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <Wallet className="h-4 w-4" />
          <span>Connect Wallet</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-cyan-400" />
              My On-Chain Verifications
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Active verification records registered on BOT Chain for your connected wallet.
            </p>
          </div>

          <button
            type="button"
            onClick={() => refetchConnectedRecord()}
            className="self-start sm:self-auto px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-xs text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-cyan-400 ${
                isLoadingConnectedRecord ? 'animate-spin' : ''
              }`}
            />
            <span>Refresh Record</span>
          </button>
        </div>

        {/* Connected Wallet Info */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 block">
                Connected Wallet
              </span>
              <div className="flex items-center gap-2 font-mono text-xs sm:text-sm text-slate-200 mt-0.5 break-all">
                <span>{address}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(address, 'wallet')}
                  className="text-slate-400 hover:text-cyan-400"
                >
                  {copiedField === 'wallet' ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Status Badge */}
            <div className="mt-2 sm:mt-0">
              {isLoadingConnectedRecord ? (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400">
                  Querying Registry...
                </span>
              ) : isConnectedVerified && connectedRecord?.isActive ? (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 border border-emerald-800 text-emerald-400 inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Active On-Chain Record
                </span>
              ) : connectedRecord && !connectedRecord.isActive && connectedRecord.timestamp > 0 ? (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/80 border border-amber-800 text-amber-400 inline-flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Revoked Record
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-400 inline-flex items-center gap-1.5">
                  No Active Record
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Active Record Details */}
        {connectedRecord && connectedRecord.timestamp > 0 ? (
          <div className="bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 mb-6">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Registered Verification Details
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Registration Timestamp */}
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-lg p-3">
                <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                  <Clock className="h-3.5 w-3.5 text-cyan-400" />
                  Registration Timestamp
                </span>
                <span className="text-sm font-medium text-slate-200">
                  {new Date(connectedRecord.timestamp * 1000).toLocaleString()}
                </span>
                <span className="block text-[11px] font-mono text-slate-500 mt-0.5">
                  Unix: {connectedRecord.timestamp}
                </span>
              </div>

              {/* Status */}
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-lg p-3">
                <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
                  Record Status
                </span>
                <span
                  className={`text-sm font-medium ${
                    connectedRecord.isActive ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {connectedRecord.isActive ? 'Active & Valid' : 'Revoked by Wallet'}
                </span>
                <span className="block text-[11px] text-slate-500 mt-0.5">
                  Registry: {registryAddress.slice(0, 10)}...{registryAddress.slice(-8)}
                </span>
              </div>
            </div>

            {/* Message Hash */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-400 font-medium">Stored Message Hash</span>
                <button
                  type="button"
                  onClick={() => handleCopy(connectedRecord.messageHash, 'rec-hash')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  {copiedField === 'rec-hash' ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  Copy Hash
                </button>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 font-mono text-xs text-slate-300 break-all select-all">
                {connectedRecord.messageHash}
              </div>
            </div>

            {/* Revoke Button if active */}
            {connectedRecord.isActive && (
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isSubmittingTx || isConfirmingTx}
                  onClick={handleRevoke}
                  className="py-2 px-4 rounded-xl border border-red-800/60 bg-red-950/30 hover:bg-red-900/40 text-red-300 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
                  <span>
                    {isSubmittingTx || isConfirmingTx
                      ? 'Revoking on BOT Chain...'
                      : 'Revoke Verification Record'}
                  </span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-6 text-center space-y-3 mb-6">
            <p className="text-sm text-slate-300">
              No on-chain record exists yet for this wallet on BOT Chain.
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              First create and sign a verification message in the Sign panel, then register your record.
            </p>
            <button
              type="button"
              onClick={onNavigateToSign}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors cursor-pointer"
            >
              Go to Sign Message Panel
            </button>
          </div>
        )}

        {/* Manual Register with Hash Form */}
        <div className="border-t border-slate-800/80 pt-5">
          <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-3 flex items-center gap-1.5">
            <PlusCircle className="h-4 w-4 text-cyan-400" />
            Register Verification by Message Hash
          </h4>
          <p className="text-xs text-slate-500 mb-3">
            If you verified a signature elsewhere or have an off-chain message hash ready, you can submit the registration transaction directly.
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="0x... (32-byte keccak256 or EIP-712 message hash)"
              value={inputHash}
              onChange={(e) => setInputHash(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="button"
              disabled={isSubmittingTx || isConfirmingTx || !inputHash.trim()}
              onClick={handleManualRegister}
              className="py-2 px-4 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white shadow-md shadow-cyan-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              {isSubmittingTx || isConfirmingTx ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Register Hash</span>
              )}
            </button>
          </div>
        </div>

        {/* Transaction Feedback */}
        {txHash && (
          <div className="mt-4 p-3.5 bg-blue-950/30 border border-blue-900/50 rounded-xl text-xs text-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw
                className={`h-4 w-4 text-cyan-400 ${
                  isConfirmingTx ? 'animate-spin' : ''
                }`}
              />
              <span>
                {isConfirmingTx
                  ? 'Transaction submitted. Waiting for BOT Chain confirmation...'
                  : isTxSuccess
                  ? 'Transaction successfully confirmed on BOT Chain!'
                  : 'Transaction broadcasted.'}
              </span>
            </div>
            <a
              href={`${explorerBase}/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1 text-[11px]"
            >
              <span>View on BOTScan</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {/* Action Error */}
        {(actionError || writeError) && (
          <div className="mt-4 p-3 bg-red-950/40 border border-red-900/60 rounded-xl text-xs text-red-300 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <span>{actionError || writeError?.message}</span>
          </div>
        )}
      </div>
    </div>
  );
};

