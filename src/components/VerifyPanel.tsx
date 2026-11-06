import React, { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Key,
  Copy,
  Check,
  Search,
  Code,
  FileCheck,
} from 'lucide-react';
import {
  verifySignatureLocally,
  type VerificationResult,
  type SignatureType,
} from '../utils/signature';

interface VerifyPanelProps {
  initialData?: {
    claimedAddress: string;
    message: string;
    signature: string;
    type: SignatureType;
  } | null;
  onSearchPublicRecord: (wallet: string) => void;
}

export const VerifyPanel: React.FC<VerifyPanelProps> = ({
  initialData,
  onSearchPublicRecord,
}) => {
  const publicClient = usePublicClient();

  const [claimedAddress, setClaimedAddress] = useState(initialData?.claimedAddress || '');
  const [signatureType, setSignatureType] = useState<SignatureType>(
    initialData?.type || 'eip712'
  );
  const [message, setMessage] = useState(initialData?.message || '');
  const [signature, setSignature] = useState(initialData?.signature || '');

  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Sync initialData when passed
  useEffect(() => {
    if (initialData) {
      setClaimedAddress(initialData.claimedAddress);
      setMessage(initialData.message);
      setSignature(initialData.signature);
      setSignatureType(initialData.type);
      setResult(null);
      setError(null);
    }
  }, [initialData]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleVerify = async () => {
    setError(null);
    setResult(null);

    if (!claimedAddress.trim()) {
      setError('Please provide a claimed wallet address.');
      return;
    }
    if (!message.trim()) {
      setError('Please provide the original message payload.');
      return;
    }
    if (!signature.trim()) {
      setError('Please provide the signature.');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await verifySignatureLocally({
        claimedAddress: claimedAddress.trim(),
        rawMessage: message.trim(),
        signature: signature.trim(),
        signatureType,
        publicClient: publicClient || undefined,
      });

      setResult(res);
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err?.message || 'Verification failed unexpectedly.');
    } finally {
      setIsVerifying(false);
    }
  };

  const loadExample = () => {
    // Helpful demo helper for instant testing
    const demoWallet = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
    const now = Math.floor(Date.now() / 1000);
    const demoPayload = JSON.stringify(
      {
        domain: {
          name: 'SignatureCheck',
          version: '1',
          chainId: 968,
        },
        message: {
          wallet: demoWallet,
          statement: 'I hereby verify ownership and control of this EVM wallet on BOT Chain.',
          nonce: '48c3f9a7210e45b892',
          issuedAt: now,
          expiresAt: now + 86400,
        },
      },
      null,
      2
    );

    setClaimedAddress(demoWallet);
    setMessage(demoPayload);
    setSignatureType('eip712');
    setSignature('0x38b251a37c09e3a6c117d917fbf7b0f1fa4356e30b62fcbaefd74e622b79375176c125df1076b9f1d0b57fa23ea6e974dfab5e7514a4db4a816a3fa99994c99c1c');
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-cyan-400" />
              Independent Signature Verifier
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Verify cryptographic EVM signatures locally without submitting on-chain transactions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadExample}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium px-2.5 py-1 rounded-lg border border-cyan-800/60 bg-cyan-950/40"
            >
              Load Example
            </button>
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setSignatureType('eip712')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  signatureType === 'eip712'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                EIP-712
              </button>
              <button
                type="button"
                onClick={() => setSignatureType('eip191')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  signatureType === 'eip191'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                EIP-191
              </button>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <div className="space-y-4">
          {/* Claimed Address */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              Claimed Wallet Address
            </label>
            <input
              type="text"
              placeholder="0x..."
              value={claimedAddress}
              onChange={(e) => setClaimedAddress(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Original Message */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              Original Signed Message (JSON Payload or Formatted Text)
            </label>
            <textarea
              rows={5}
              placeholder={
                signatureType === 'eip712'
                  ? '{\n  "domain": { ... },\n  "message": { ... }\n}'
                  : '[SignatureCheck Ownership Verification]\nChain ID: 968\nWallet: 0x...\n...'
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Signature */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              Cryptographic Signature (0x...)
            </label>
            <textarea
              rows={2}
              placeholder="0x..."
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Error notice */}
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Verify Action Button */}
          <button
            type="button"
            disabled={isVerifying}
            onClick={handleVerify}
            className="w-full py-3 px-4 rounded-xl font-medium text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isVerifying ? (
              <span>Performing Cryptographic Recovery...</span>
            ) : (
              <>
                <FileCheck className="h-4 w-4" />
                <span>Verify Signature Locally</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Verification Result Card */}
      {result && (
        <div
          className={`border rounded-2xl p-6 shadow-xl space-y-6 transition-all duration-300 ${
            result.isValid
              ? 'bg-gradient-to-b from-emerald-950/20 to-slate-950 border-emerald-500/40 shadow-emerald-950/20'
              : 'bg-gradient-to-b from-rose-950/20 to-slate-950 border-rose-500/40 shadow-rose-950/20'
          }`}
        >
          {/* Main Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              {result.isValid ? (
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
              ) : (
                <div className="h-12 w-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <XCircle className="h-7 w-7" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h3
                    className={`text-lg font-bold tracking-tight ${
                      result.isValid ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {result.isValid ? 'VALID SIGNATURE' : 'INVALID SIGNATURE'}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {result.signatureType.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {result.isValid
                    ? 'Cryptographic proof confirmed: Signer recovered and conditions met.'
                    : result.errorMessage || 'The provided signature could not be validated.'}
                </p>
              </div>
            </div>

            {/* Public search shortcut */}
            <button
              type="button"
              onClick={() => onSearchPublicRecord(result.claimedAddress)}
              className="self-start sm:self-auto px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-xs text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Search className="h-3.5 w-3.5 text-cyan-400" />
              <span>Check On-Chain Registry</span>
            </button>
          </div>

          {/* Verification Attributes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Address Match Attribute */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-slate-400" />
                  Address Recovery & Match
                </span>
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                    result.addressMatches
                      ? 'bg-emerald-950 border border-emerald-800 text-emerald-400'
                      : 'bg-rose-950 border border-rose-800 text-rose-400'
                  }`}
                >
                  {result.addressMatches ? 'MATCH' : 'MISMATCH'}
                </span>
              </div>
              <div className="text-xs font-mono text-slate-200 break-all">
                <span className="text-slate-500 text-[10px] block">Recovered Signer:</span>
                {result.recoveredSigner || (result.erc1271Verified ? 'ERC-1271 Contract Wallet' : 'None')}
              </div>
            </div>

            {/* Expiry Check Attribute */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  Expiry Status
                </span>
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                    !result.isExpired
                      ? 'bg-emerald-950 border border-emerald-800 text-emerald-400'
                      : 'bg-rose-950 border border-rose-800 text-rose-400'
                  }`}
                >
                  {result.isExpired ? 'EXPIRED' : 'ACTIVE / VALID'}
                </span>
              </div>
              <div className="text-xs text-slate-200">
                {result.expiryDate ? (
                  <span>Expires: {result.expiryDate.toLocaleString()}</span>
                ) : (
                  <span className="text-slate-500">No explicit expiry timestamp</span>
                )}
              </div>
            </div>

            {/* Nonce Check Attribute */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                  Replay Protection Nonce
                </span>
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                    result.hasValidNonce
                      ? 'bg-emerald-950 border border-emerald-800 text-emerald-400'
                      : 'bg-amber-950 border border-amber-800 text-amber-400'
                  }`}
                >
                  {result.hasValidNonce ? 'NONCE VALID' : 'NO NONCE'}
                </span>
              </div>
              <div className="text-xs text-slate-400">
                {result.hasValidNonce
                  ? 'Contains unique cryptographic nonce.'
                  : 'Message lacks high-entropy nonce.'}
              </div>
            </div>

            {/* Smart Contract Account (ERC-1271) Attribute */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                  <Code className="h-3.5 w-3.5 text-slate-400" />
                  Contract Wallet (ERC-1271)
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {result.isContractWallet ? 'Smart Account' : 'EOA'}
                </span>
              </div>
              <div className="text-xs text-slate-400">
                {result.isContractWallet
                  ? result.erc1271Verified
                    ? 'Successfully verified via ERC-1271 isValidSignature.'
                    : 'Contract wallet signature check failed.'
                  : 'Standard Externally Owned Account (EOA).'}
              </div>
            </div>
          </div>

          {/* Computed Message Hash */}
          <div className="pt-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-slate-400">
                Computed Verification Message Hash
              </span>
              <button
                type="button"
                onClick={() => handleCopy(result.messageHash, 'result-hash')}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                {copiedField === 'result-hash' ? (
                  <Check className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                Copy Hash
              </button>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono text-xs text-slate-300 break-all select-all">
              {result.messageHash}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
