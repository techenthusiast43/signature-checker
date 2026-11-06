import React, { useState } from 'react';
import { X, Settings, RefreshCw, Check, ExternalLink } from 'lucide-react';
import { isAddress } from 'viem';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAddress: string;
  onSaveAddress: (addr: string) => void;
  onResetAddress: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentAddress,
  onSaveAddress,
  onResetAddress,
}) => {
  const [addressInput, setAddressInput] = useState(currentAddress);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setError(null);
    if (!isAddress(addressInput.trim())) {
      setError('Please provide a valid EVM contract address.');
      return;
    }
    onSaveAddress(addressInput.trim());
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1000);
  };

  const handleReset = () => {
    onResetAddress();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-5 p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Settings className="h-5 w-5 text-cyan-400" />
            <span>Registry & Network Configuration</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Custom Registry Address */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              SignatureRegistry Contract Address
            </label>
            <input
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="0x..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {error && <div className="text-xs text-red-400">{error}</div>}

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Reset to Default Address
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {isSaved ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-300" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Contract Address</span>
              )}
            </button>
          </div>
        </div>

        {/* Official BOT Chain Reference */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-3">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Official BOT Chain Parameters
          </span>

          <div className="text-xs space-y-2 text-slate-300">
            <div className="flex justify-between border-b border-slate-900 pb-1.5">
              <span className="text-slate-500">Testnet (Bohr):</span>
              <span className="font-mono text-cyan-400">Chain ID 968</span>
            </div>
            <div className="flex justify-between border-b border-slate-900 pb-1.5">
              <span className="text-slate-500">Testnet RPC:</span>
              <span className="font-mono text-slate-300">https://rpc.bohr.life</span>
            </div>
            <div className="flex justify-between border-b border-slate-900 pb-1.5">
              <span className="text-slate-500">Testnet Explorer:</span>
              <a
                href="https://scan.bohr.life"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline inline-flex items-center gap-1 font-mono"
              >
                <span>scan.bohr.life</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="flex justify-between border-b border-slate-900 pb-1.5">
              <span className="text-slate-500">Mainnet:</span>
              <span className="font-mono text-blue-400">Chain ID 677</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Mainnet RPC:</span>
              <span className="font-mono text-slate-300">https://rpc.botchain.ai</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
