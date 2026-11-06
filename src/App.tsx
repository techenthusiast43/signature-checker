import { useState } from 'react';
import {
  PenTool,
  ShieldCheck,
  Layers,
  Search,
  ExternalLink,
  Shield,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Header } from './components/Header';
import { SignPanel } from './components/SignPanel';
import { VerifyPanel } from './components/VerifyPanel';
import { MyVerificationsPanel } from './components/MyVerificationsPanel';
import { PublicVerifyPanel } from './components/PublicVerifyPanel';
import { SettingsModal } from './components/SettingsModal';
import { useRegistry } from './hooks/useRegistry';
import type { SignatureType } from './utils/signature';
import type { Hex } from 'viem';

type TabType = 'sign' | 'verify' | 'my-records' | 'public-search';

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('sign');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Cross-panel data transfer
  const [verifyInitialData, setVerifyInitialData] = useState<{
    claimedAddress: string;
    message: string;
    signature: string;
    type: SignatureType;
  } | null>(null);

  const [publicSearchAddress, setPublicSearchAddress] = useState<string>('');

  const {
    registryAddress,
    updateRegistryAddress,
    resetRegistryAddress,
    registerVerification,
    isSubmittingTx,
    isConfirmingTx,
  } = useRegistry();

  const [notification, setNotification] = useState<{
    type: 'success' | 'info' | 'error';
    message: string;
  } | null>(null);

  const handleRegisterOnChain = async (messageHash: Hex) => {
    try {
      setNotification({
        type: 'info',
        message: 'Submitting verification registration transaction to BOT Chain...',
      });
      await registerVerification(messageHash);
      setNotification({
        type: 'success',
        message: 'Verification registration submitted to BOT Chain!',
      });
    } catch (err: any) {
      console.error(err);
      setNotification({
        type: 'error',
        message: err?.shortMessage || err?.message || 'Transaction was rejected or failed.',
      });
    }
  };

  const handleSendToVerify = (data: {
    claimedAddress: string;
    message: string;
    signature: string;
    type: SignatureType;
  }) => {
    setVerifyInitialData(data);
    setActiveTab('verify');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchPublicRecord = (wallet: string) => {
    setPublicSearchAddress(wallet);
    setActiveTab('public-search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navbar */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        registryAddress={registryAddress}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner / Hero Highlights */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-cyan-950/30 border border-slate-800 p-6 sm:p-8">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 text-xs font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>BOT Chain Bohr Testnet (Chain ID 968)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Decentralized EVM Wallet Ownership Verification
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Cryptographically prove and verify EVM wallet ownership using standard EIP-712 structured data and EIP-191 signatures with optional on-chain timestamped registry records.
            </p>
          </div>

          {/* Quick stats pills */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-2.5">
              <span className="text-slate-500 block">Native Token</span>
              <span className="font-semibold text-slate-200 font-mono">BOT (150M Supply)</span>
            </div>
            <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-2.5">
              <span className="text-slate-500 block">Standards</span>
              <span className="font-semibold text-slate-200 font-mono">EIP-712 / EIP-191 / ERC-1271</span>
            </div>
            <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-2.5">
              <span className="text-slate-500 block">Default RPC</span>
              <span className="font-semibold text-slate-200 font-mono truncate block">rpc.bohr.life</span>
            </div>
            <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-2.5">
              <span className="text-slate-500 block">Explorer</span>
              <span className="font-semibold text-cyan-400 font-mono truncate block">scan.bohr.life</span>
            </div>
          </div>
        </div>

        {/* Global Notifications */}
        {notification && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-xs transition-all ${
              notification.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                : notification.type === 'error'
                ? 'bg-red-950/40 border-red-800/80 text-red-300'
                : 'bg-blue-950/40 border-blue-800/80 text-blue-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              ) : notification.type === 'error' ? (
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              ) : (
                <Shield className="h-4 w-4 text-blue-400 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-white ml-2 text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('sign')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'sign'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
            }`}
          >
            <PenTool className="h-4 w-4" />
            <span>1. Sign Message</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('verify')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'verify'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>2. Verify Signature</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('my-records')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'my-records'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>3. My Verifications</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('public-search')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'public-search'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
            }`}
          >
            <Search className="h-4 w-4" />
            <span>4. Public Verification</span>
          </button>
        </div>

        {/* Tab Content Panes */}
        <div>
          {activeTab === 'sign' && (
            <SignPanel
              onRegisterOnChain={handleRegisterOnChain}
              isRegisteringOnChain={isSubmittingTx || isConfirmingTx}
              onSendToVerify={handleSendToVerify}
            />
          )}

          {activeTab === 'verify' && (
            <VerifyPanel
              initialData={verifyInitialData}
              onSearchPublicRecord={handleSearchPublicRecord}
            />
          )}

          {activeTab === 'my-records' && (
            <MyVerificationsPanel onNavigateToSign={() => setActiveTab('sign')} />
          )}

          {activeTab === 'public-search' && (
            <PublicVerifyPanel initialSearchAddress={publicSearchAddress} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 mt-12 text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">SignatureCheck</span>
              <span>— Decentralized Wallet Ownership Verification</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <a
                href="https://scan.bohr.life"
                target="_blank"
                rel="noreferrer"
                className="hover:text-cyan-400 flex items-center gap-1"
              >
                <span>Bohr BOTScan</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="https://scan.botchain.ai"
                target="_blank"
                rel="noreferrer"
                className="hover:text-cyan-400 flex items-center gap-1"
              >
                <span>Mainnet BOTScan</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Security Guarantee: SignatureCheck uses standard cryptographic ECDSA signatures (EIP-712 / EIP-191) to verify EVM wallet control. Private keys are never handled or requested. On-chain registry interactions are strictly opt-in and record timestamped hashes without sending unwarranted transactions.
          </p>
        </div>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentAddress={registryAddress}
        onSaveAddress={updateRegistryAddress}
        onResetAddress={resetRegistryAddress}
      />
    </div>
  );
}

export default App;
