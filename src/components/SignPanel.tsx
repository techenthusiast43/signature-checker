import React, { useState } from 'react';
import { useAccount, useSignTypedData, useSignMessage, useChainId } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import {
  PenTool,
  Copy,
  Check,
  RefreshCw,
  Clock,
  Shield,
  Layers,
  Sparkles,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import {
  generateNonce,
  buildTypedData,
  buildEip191MessageString,
  calculateMessageHash,
  DEFAULT_STATEMENT,
  SIGNATURE_DOMAIN_NAME,
  SIGNATURE_DOMAIN_VERSION,
  type VerificationMessageData,
  type SignatureType,
} from '../utils/signature';
import { botChainTestnet } from '../config/chains';
import type { Hex } from 'viem';

interface SignPanelProps {
  onRegisterOnChain: (messageHash: Hex) => void;
  isRegisteringOnChain: boolean;
  onSendToVerify: (data: { claimedAddress: string; message: string; signature: string; type: SignatureType }) => void;
}

export const SignPanel: React.FC<SignPanelProps> = ({
  onRegisterOnChain,
  isRegisteringOnChain,
  onSendToVerify,
}) => {
  const { address, isConnected } = useAccount();
  const currentChainId = useChainId();
  const { open } = useAppKit();

  const activeChainId = currentChainId || botChainTestnet.id;

  // Form State
  const [signatureType, setSignatureType] = useState<SignatureType>('eip712');
  const [statement, setStatement] = useState(DEFAULT_STATEMENT);
  const [nonce, setNonce] = useState(generateNonce());
  const [expiryHours, setExpiryHours] = useState<number>(24);
  const [issuedAt, setIssuedAt] = useState<number>(() => Math.floor(Date.now() / 1000));

  // Output State
  const [signedSignature, setSignedSignature] = useState<string | null>(null);
  const [signedMessageText, setSignedMessageText] = useState<string | null>(null);
  const [computedHash, setComputedHash] = useState<Hex | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [signError, setSignError] = useState<string | null>(null);

  // Wagmi hooks
  const { signTypedDataAsync, isPending: isSigningTypedData } = useSignTypedData();
  const { signMessageAsync, isPending: isSigningMessage } = useSignMessage();
  const isSigning = isSigningTypedData || isSigningMessage;

  const refreshNonceAndTimestamp = () => {
    setNonce(generateNonce());
    setIssuedAt(Math.floor(Date.now() / 1000));
    setSignedSignature(null);
    setSignedMessageText(null);
    setComputedHash(null);
    setSignError(null);
  };

  const expiresAt = issuedAt + expiryHours * 3600;

  const currentMessageData: VerificationMessageData = {
    wallet: address || '0x0000000000000000000000000000000000000000',
    statement,
    nonce,
    issuedAt,
    expiresAt,
    chainId: activeChainId,
  };

  const previewEip191 = buildEip191MessageString(currentMessageData);

  const previewJsonString = JSON.stringify(
    {
      domain: {
        name: SIGNATURE_DOMAIN_NAME,
        version: SIGNATURE_DOMAIN_VERSION,
        chainId: activeChainId,
      },
      message: {
        wallet: currentMessageData.wallet,
        statement: currentMessageData.statement,
        nonce: currentMessageData.nonce,
        issuedAt: currentMessageData.issuedAt,
        expiresAt: currentMessageData.expiresAt,
      },
    },
    null,
    2
  );

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSign = async () => {
    if (!isConnected || !address) {
      open();
      return;
    }

    setSignError(null);
    try {
      const now = Math.floor(Date.now() / 1000);
      setIssuedAt(now);

      const msgData: VerificationMessageData = {
        wallet: address,
        statement,
        nonce,
        issuedAt: now,
        expiresAt: now + expiryHours * 3600,
        chainId: activeChainId,
      };

      let signatureResult: string;
      let finalMessageString: string;
      let hashResult: Hex;

      if (signatureType === 'eip712') {
        const typedData = buildTypedData(msgData);
        signatureResult = await signTypedDataAsync({
          domain: typedData.domain,
          types: typedData.types,
          primaryType: typedData.primaryType,
          message: typedData.message,
        });

        finalMessageString = JSON.stringify(
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

        hashResult = calculateMessageHash('eip712', msgData);
      } else {
        finalMessageString = buildEip191MessageString(msgData);
        signatureResult = await signMessageAsync({
          message: finalMessageString,
        });
        hashResult = calculateMessageHash('eip191', msgData, finalMessageString);
      }

      setSignedSignature(signatureResult);
      setSignedMessageText(finalMessageString);
      setComputedHash(hashResult);
    } catch (err: any) {
      console.error('Signing error:', err);
      setSignError(err?.shortMessage || err?.message || 'Failed to sign message with wallet.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Panel Intro */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <PenTool className="h-5 w-5 text-cyan-400" />
              Sign Ownership Verification Message
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Prove control of your EVM wallet by generating a cryptographic signature.
            </p>
          </div>

          {/* Standard Toggle */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => {
                setSignatureType('eip712');
                setSignedSignature(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                signatureType === 'eip712'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EIP-712 (Typed)
            </button>
            <button
              onClick={() => {
                setSignatureType('eip191');
                setSignedSignature(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                signatureType === 'eip191'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EIP-191 (Text)
            </button>
          </div>
        </div>

        {/* Security Alert */}
        <div className="flex items-start gap-3 p-3.5 bg-blue-950/30 border border-blue-900/50 rounded-xl text-xs text-blue-300 mb-6">
          <Shield className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-blue-200">Security Guarantee: </span>
            This process only uses standard off-chain wallet signing. SignatureCheck{' '}
            <span className="underline">never</span> requests your private key or seed phrase,
            and ordinary signing requires zero gas fees.
          </div>
        </div>

        {/* Message Configuration Fields */}
        <div className="space-y-4">
          {/* Statement */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Verification Statement
              </label>
              <button
                type="button"
                onClick={() => setStatement(DEFAULT_STATEMENT)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300"
              >
                Reset Default
              </button>
            </div>
            <input
              type="text"
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Nonce */}
            <div className="sm:col-span-2">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  Replay Protection Nonce
                </label>
                <button
                  type="button"
                  onClick={refreshNonceAndTimestamp}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  Regenerate
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={nonce}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-300 select-all"
                />
              </div>
            </div>

            {/* Expiry Duration */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5 flex items-center gap-1">
                <Clock className="h-3 w-3 text-slate-400" />
                Validity Period
              </label>
              <select
                value={expiryHours}
                onChange={(e) => setExpiryHours(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value={1}>1 Hour</option>
                <option value={24}>24 Hours</option>
                <option value={168}>7 Days</option>
                <option value={720}>30 Days</option>
              </select>
            </div>
          </div>

          {/* Target Chain Info */}
          <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-400">Target BOT Chain Network:</span>
            <span className="font-mono text-cyan-400 font-medium">
              Chain ID: {activeChainId} ({activeChainId === 968 ? 'Bohr Testnet' : 'BOT Mainnet'})
            </span>
          </div>

          {/* Live Message Preview */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Message Payload to Sign ({signatureType.toUpperCase()})
              </label>
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    signatureType === 'eip712' ? previewJsonString : previewEip191,
                    'preview'
                  )
                }
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                {copiedField === 'preview' ? (
                  <Check className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                Copy Preview
              </button>
            </div>
            <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48 leading-relaxed">
              {signatureType === 'eip712' ? previewJsonString : previewEip191}
            </pre>
          </div>

          {/* Error Message */}
          {signError && (
            <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-xl text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <span>{signError}</span>
            </div>
          )}

          {/* Sign Button */}
          <div>
            {!isConnected ? (
              <button
                type="button"
                onClick={() => open()}
                className="w-full py-3 px-4 rounded-xl font-medium text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <PenTool className="h-4 w-4" />
                <span>Connect Wallet to Sign</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={isSigning}
                onClick={handleSign}
                className="w-full py-3 px-4 rounded-xl font-medium text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSigning ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Awaiting Wallet Signature...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Sign with Connected Wallet</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Generated Signature Result Card */}
      {signedSignature && signedMessageText && computedHash && (
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/30 rounded-2xl p-6 shadow-xl shadow-cyan-950/20 space-y-5 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
              <Check className="h-4 w-4 rounded-full bg-emerald-950 border border-emerald-800 p-0.5" />
              <span>Signature Generated Successfully</span>
            </div>
            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/50 border border-cyan-800 px-2 py-0.5 rounded-full">
              {signatureType.toUpperCase()}
            </span>
          </div>

          {/* Signature Box */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Cryptographic Signature
              </label>
              <button
                type="button"
                onClick={() => handleCopy(signedSignature, 'sig')}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
              >
                {copiedField === 'sig' ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                Copy Signature
              </button>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-cyan-200 break-all select-all">
              {signedSignature}
            </div>
          </div>

          {/* Message Hash Box */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Message Hash (keccak256 / EIP-712 Hash)
              </label>
              <button
                type="button"
                onClick={() => handleCopy(computedHash, 'hash')}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
              >
                {copiedField === 'hash' ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                Copy Hash
              </button>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-300 break-all select-all">
              {computedHash}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() =>
                onSendToVerify({
                  claimedAddress: address || '',
                  message: signedMessageText,
                  signature: signedSignature,
                  type: signatureType,
                })
              }
              className="py-2.5 px-4 rounded-xl border border-slate-700 hover:border-cyan-500/50 bg-slate-800/60 hover:bg-slate-800 text-xs font-medium text-slate-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Test in Signature Verifier</span>
              <ArrowRight className="h-3.5 w-3.5 text-cyan-400" />
            </button>

            <button
              type="button"
              disabled={isRegisteringOnChain}
              onClick={() => onRegisterOnChain(computedHash)}
              className="py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-xs font-semibold text-white shadow-md shadow-cyan-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isRegisteringOnChain ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Registering on BOT Chain...</span>
                </>
              ) : (
                <>
                  <Layers className="h-3.5 w-3.5" />
                  <span>Register On-Chain Record</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
