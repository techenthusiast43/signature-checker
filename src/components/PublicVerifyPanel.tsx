import React, { useState, useEffect } from 'react';
import { useChainId } from 'wagmi';
import {
  Search,
  ShieldCheck,
  ShieldAlert,
  Clock,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { useRegistry, type VerificationRecordState } from '../hooks/useRegistry';
import { isAddress, getAddress } from 'viem';
import { botChainTestnet, botChainMainnet } from '../config/chains';

interface PublicVerifyPanelProps {
  initialSearchAddress?: string;
}

export const PublicVerifyPanel: React.FC<PublicVerifyPanelProps> = ({
  initialSearchAddress,
}) => {
  const chainId = useChainId();
  const { fetchWalletRecord, registryAddress } = useRegistry();

  const [searchQuery, setSearchQuery] = useState(initialSearchAddress || '');
  const [isSearching, setIsSearching] = useState(false);
  const [queriedRecord, setQueriedRecord] = useState<VerificationRecordState | null>(null);
  const [hasQueried, setHasQueried] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const explorerBase =
    chainId === botChainMainnet.id
      ? botChainMainnet.blockExplorers.default.url
      : botChainTestnet.blockExplorers.default.url;

  useEffect(() => {
    if (initialSearchAddress && isAddress(initialSearchAddress)) {
      setSearchQuery(initialSearchAddress);
      performSearch(initialSearchAddress);
    }
  }, [initialSearchAddress]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const performSearch = async (addressToSearch: string) => {
    setSearchError(null);
    setQueriedRecord(null);
    setHasQueried(false);

    const clean = addressToSearch.trim();
    if (!clean) {
      setSearchError('Please enter an EVM wallet address.');
      return;
    }
    if (!isAddress(clean)) {
      setSearchError('Invalid EVM address format. Please check the address.');
      return;
    }

    setIsSearching(true);
    try {
      const normalized = getAddress(clean);
      const record = await fetchWalletRecord(normalized);
      setQueriedRecord(record);
      setHasQueried(true);
    } catch (err: any) {
      console.error('Search error:', err);
      setSearchError(err?.message || 'Failed to query on-chain registry on BOT Chain.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Search className="h-5 w-5 text-cyan-400" />
            Public Verification Search
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Query the BOT Chain registry for any EVM wallet address to view its verification status.
          </p>
        </div>

        {/* Search Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            performSearch(searchQuery);
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Enter EVM wallet address (0x...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm font-mono text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="py-3 px-6 rounded-xl font-medium text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            {isSearching ? (
              <span>Querying BOT Chain...</span>
            ) : (
              <>
                <Search className="h-4 w-4" />
                <span>Search Registry</span>
              </>
            )}
          </button>
        </form>

        {searchError && (
          <div className="mt-4 p-3 bg-red-950/40 border border-red-900/60 rounded-xl text-xs text-red-300">
            {searchError}
          </div>
        )}
      </div>

      {/* Query Result */}
      {hasQueried && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                Queried Address
              </span>
              <div className="flex items-center gap-2 font-mono text-sm text-slate-200 mt-0.5 break-all">
                <span>{searchQuery}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(searchQuery, 'search-addr')}
                  className="text-slate-400 hover:text-cyan-400"
                >
                  {copiedField === 'search-addr' ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
                <a
                  href={`${explorerBase}/address/${searchQuery}`}
                  target="_blank"
                  rel="noreferrer"
                  title="View on BOTScan"
                  className="text-slate-400 hover:text-cyan-400"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {/* Status Badge */}
            <div className="self-start sm:self-auto">
              {queriedRecord && queriedRecord.isActive ? (
                <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 border border-emerald-800 text-emerald-400 inline-flex items-center gap-1.5 shadow-sm">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Active On-Chain Record
                </span>
              ) : queriedRecord && !queriedRecord.isActive && queriedRecord.timestamp > 0 ? (
                <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-amber-950/80 border border-amber-800 text-amber-400 inline-flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Revoked Record
                </span>
              ) : (
                <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-400 inline-flex items-center gap-1.5">
                  No Record Found
                </span>
              )}
            </div>
          </div>

          {/* Record Details */}
          {queriedRecord && queriedRecord.timestamp > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                    <Clock className="h-3.5 w-3.5 text-cyan-400" />
                    Registration Timestamp
                  </span>
                  <span className="text-sm font-medium text-slate-200">
                    {new Date(queriedRecord.timestamp * 1000).toLocaleString()}
                  </span>
                  <span className="block text-[11px] font-mono text-slate-500 mt-0.5">
                    Unix: {queriedRecord.timestamp}
                  </span>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
                    Verification Registry Status
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      queriedRecord.isActive ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {queriedRecord.isActive ? 'Active and Current' : 'Revoked by Wallet'}
                  </span>
                  <span className="block text-[11px] text-slate-500 mt-0.5 font-mono">
                    Contract: {registryAddress.slice(0, 10)}...{registryAddress.slice(-6)}
                  </span>
                </div>
              </div>

              {/* Message Hash */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-400 font-medium">
                    Registered Message Hash
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(queriedRecord.messageHash, 'query-hash')}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    {copiedField === 'query-hash' ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    Copy Hash
                  </button>
                </div>
                <div className="font-mono text-xs text-slate-300 break-all select-all">
                  {queriedRecord.messageHash}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-6 text-center text-slate-400 text-sm">
              This wallet has not registered a verification record on BOT Chain yet.
            </div>
          )}

          {/* CRITICAL SECURITY & IDENTITY DISCLAIMER */}
          <div className="bg-amber-950/20 border border-amber-900/50 rounded-xl p-4 text-xs text-amber-300/90 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Identity & Cryptographic Boundary Notice</span>
            </div>
            <p className="leading-relaxed">
              This registry record proves solely that the owner of the private key (or smart contract)
              corresponding to this EVM wallet initiated a verification record at the indicated block
              timestamp on BOT Chain.
            </p>
            <p className="leading-relaxed text-amber-400/80">
              <strong>It does NOT prove:</strong> Real-world legal identity, KYC/AML standing, creditworthiness,
              or absence of compromise. Anyone verifying claims should verify the underlying signature message
              and verify the signer's identity through appropriate secondary channels.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
