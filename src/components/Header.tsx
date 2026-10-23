import React, { useState } from 'react';
import { 
  Activity, 
  ChevronDown, 
  ShieldAlert, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Wallet, 
  RefreshCw, 
  LogOut,
  ExternalLink,
  SlidersHorizontal,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Key
} from 'lucide-react';
import { AccountInfo, MarketSymbol } from '../types';
import { POPULAR_SYMBOLS } from '../services/analyzer';
import { soundFx } from '../utils/audio';

interface HeaderProps {
  currentSymbol: MarketSymbol;
  onSelectSymbol: (symbol: MarketSymbol) => void;
  status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'AUTHORIZED' | 'ERROR';
  activeAccount: AccountInfo | null;
  allAccounts: AccountInfo[];
  balance: number;
  currency: string;
  isSimulated: boolean;
  onOpenSyncModal: () => void;
  onSwitchAccount: (account: AccountInfo) => void;
  onEnableSimulator: () => void;
  onResetSimulatedBalance: () => void;
  onLogout?: () => void;
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentSymbol,
  onSelectSymbol,
  status,
  activeAccount,
  allAccounts,
  balance,
  currency,
  isSimulated,
  onOpenSyncModal,
  onSwitchAccount,
  onEnableSimulator,
  onResetSimulatedBalance,
  onLogout,
}) => {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [symbolMenuOpen, setSymbolMenuOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const toggleSound = () => {
    const next = !soundEnabled;
    soundFx.enabled = next;
    setSoundEnabled(next);
  };

  const isReal = !isSimulated && activeAccount && !activeAccount.isVirtual;
  const isDemo = !isSimulated && activeAccount && activeAccount.isVirtual;

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Brand & Market Selector */}
        <div className="flex items-center gap-3 md:gap-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-400 flex items-center justify-center shadow-lg shadow-rose-600/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-white">DERIV</span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  DIGIT MATRIX
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Matches Auto-Predictor & Quantitative Engine</p>
            </div>
          </div>

          {/* Symbol Selector Dropdown */}
          <div className="relative">
            <button
              id="btn-symbol-selector"
              onClick={() => setSymbolMenuOpen(!symbolMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-sm font-medium text-slate-200 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-semibold text-white">{currentSymbol.displayName}</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {symbolMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setSymbolMenuOpen(false)} 
                />
                <div className="absolute left-0 mt-1.5 w-64 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-30 py-1.5 max-h-80 overflow-y-auto">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Synthetic Volatility Indices
                  </div>
                  {POPULAR_SYMBOLS.map((sym) => {
                    const isSelected = sym.symbol === currentSymbol.symbol;
                    return (
                      <button
                        key={sym.symbol}
                        onClick={() => {
                          onSelectSymbol(sym);
                          setSymbolMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs hover:bg-slate-800/70 transition-colors ${
                          isSelected ? 'bg-rose-500/10 text-rose-300 font-semibold' : 'text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="font-medium text-slate-200">{sym.displayName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{sym.symbol} (pip: {sym.pipSize})</div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-rose-400" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Section: Connection, Account Info, Sound, and Sync */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          
          {/* Sound Mute/Unmute */}
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Mute Audio Chimes' : 'Enable Audio Chimes'}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Account & Balance Badge */}
          <div className="relative">
            <button
              id="btn-account-menu"
              onClick={() => setAccountMenuOpen(!accountMenuOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                isReal
                  ? 'bg-amber-950/30 border-amber-500/30 hover:border-amber-500/60 text-amber-200'
                  : 'bg-emerald-950/30 border-emerald-500/30 hover:border-emerald-500/60 text-emerald-200'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {isReal ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <ShieldAlert className="w-3 h-3" /> REAL
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    DEMO
                  </span>
                )}
                
                <span className="font-mono font-bold text-sm text-white">
                  ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-slate-400">{currency}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {accountMenuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setAccountMenuOpen(false)} />
                <div className="absolute right-0 mt-1.5 w-80 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-30 py-2">
                  <div className="px-3.5 pb-2.5 border-b border-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-200">Account Details</div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isReal 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {isReal ? 'REAL MONEY' : 'DEMO ACCOUNT'}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-white font-mono font-bold">
                      {activeAccount ? activeAccount.account : 'Demo Account'}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                      <span>Available Balance:</span>
                      <span className="font-mono font-semibold text-emerald-400">
                        ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                      </span>
                    </div>
                  </div>

                  {/* Connected Accounts */}
                  {allAccounts.length > 0 && (
                    <div className="py-1">
                      <div className="px-3.5 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        Switch Account ({allAccounts.length})
                      </div>
                      {allAccounts.map((acc) => {
                        const isCurrent = activeAccount?.account === acc.account;
                        return (
                          <button
                            key={acc.account}
                            onClick={() => {
                              onSwitchAccount(acc);
                              setAccountMenuOpen(false);
                            }}
                            className={`w-full text-left px-3.5 py-1.5 text-xs flex items-center justify-between hover:bg-slate-800/70 transition-colors ${
                              isCurrent ? 'bg-rose-500/10 text-rose-300 font-semibold' : 'text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] px-1 rounded font-bold ${
                                acc.isVirtual 
                                  ? 'bg-emerald-500/20 text-emerald-400' 
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}>
                                {acc.isVirtual ? 'DEMO' : 'REAL'}
                              </span>
                              <span className="font-mono">{acc.account}</span>
                            </div>
                            {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="pt-1 mt-1 border-t border-slate-800 space-y-0.5">
                    <button
                      onClick={() => {
                        onOpenSyncModal();
                        setAccountMenuOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-1.5 text-xs text-rose-400 hover:bg-slate-800/70 flex items-center gap-2"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>API Key & Token Settings</span>
                    </button>

                    {activeAccount && onLogout && (
                      <button
                        onClick={() => {
                          onLogout();
                          setAccountMenuOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-1.5 text-xs text-rose-400 hover:bg-rose-950/40 flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Disconnect Account</span>
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Connect API Key or Status Button */}
          {!activeAccount ? (
            <div className="flex items-center gap-1.5">
              <button
                id="btn-connect-api-key"
                onClick={onOpenSyncModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-rose-600/25 transition-all cursor-pointer border border-rose-400/20"
                title="Connect Deriv API Key"
              >
                <Key className="w-3.5 h-3.5 text-rose-200" />
                <span className="hidden sm:inline">Connect API Key</span>
                <span className="sm:hidden">API Key</span>
              </button>
            </div>
          ) : (
            <button
              id="btn-open-token-settings"
              onClick={onOpenSyncModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-all cursor-pointer"
              title="View API key and token settings"
            >
              <Key className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">API Key Active</span>
              <span className="sm:hidden">Active</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
