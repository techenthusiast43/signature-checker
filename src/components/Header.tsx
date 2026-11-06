import React from 'react';
import { useAccount, useDisconnect, useSwitchChain, useChainId } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import {
  ShieldCheck,
  Wallet,
  LogOut,
  Settings,
  ChevronDown,
} from 'lucide-react';
import { botChainTestnet, botChainMainnet } from '../config/chains';

interface HeaderProps {
  onOpenSettings: () => void;
  registryAddress: string;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, registryAddress }) => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { open } = useAppKit();

  const isBohrTestnet = chainId === botChainTestnet.id;
  const isBotMainnet = chainId === botChainMainnet.id;
  const isBotChain = isBohrTestnet || isBotMainnet;

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & App Title */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">
                Signature<span className="text-cyan-400">Check</span>
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 font-mono font-medium">
                BOT Chain
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Decentralized EVM Wallet Ownership Verification
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Network Selector / Badge */}
          {isConnected && (
            <div className="relative group">
              <button
                type="button"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  isBotChain
                    ? 'bg-slate-800/80 border-slate-700 text-slate-200 hover:border-cyan-500/50'
                    : 'bg-amber-950/40 border-amber-600/50 text-amber-300 hover:bg-amber-900/40'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isBotChain ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span className="hidden md:inline">
                  {isBohrTestnet
                    ? 'BOT Chain Testnet (Bohr)'
                    : isBotMainnet
                    ? 'BOT Chain Mainnet'
                    : 'Switch to BOT Chain'}
                </span>
                <span className="md:hidden">
                  {isBohrTestnet ? 'Bohr 968' : isBotMainnet ? 'BOT 677' : 'Wrong Net'}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {/* Network Dropdown */}
              <div className="absolute right-0 mt-1 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-1 hidden group-hover:block z-50">
                <div className="px-3 py-2 text-xs text-slate-400 border-b border-slate-800">
                  Select BOT Chain Network
                </div>
                <button
                  onClick={() => switchChain({ chainId: botChainTestnet.id })}
                  className={`w-full px-3 py-2 text-xs text-left flex items-center justify-between hover:bg-slate-800 ${
                    isBohrTestnet ? 'text-cyan-400 font-medium' : 'text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan-400" />
                    <span>BOT Chain Testnet (Bohr)</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">ID: 968</span>
                </button>
                <button
                  onClick={() => switchChain({ chainId: botChainMainnet.id })}
                  className={`w-full px-3 py-2 text-xs text-left flex items-center justify-between hover:bg-slate-800 ${
                    isBotMainnet ? 'text-cyan-400 font-medium' : 'text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-400" />
                    <span>BOT Chain Mainnet</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">ID: 677</span>
                </button>
              </div>
            </div>
          )}

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            title={`Registry Contract: ${registryAddress}`}
            className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* Wallet Connect / Account Button */}
          {isConnected && address ? (
            <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 rounded-lg p-1 pl-2.5">
              <span className="text-xs font-mono text-slate-200">
                {formatAddress(address)}
              </span>
              <button
                onClick={() => disconnect()}
                title="Disconnect Wallet"
                className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-700/50 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => open()}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <Wallet className="h-4 w-4" />
              <span>Connect Wallet</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
