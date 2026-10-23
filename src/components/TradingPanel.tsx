import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Play, 
  Square, 
  AlertOctagon, 
  Sliders, 
  Zap, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  RefreshCw,
  Sparkles,
  ArrowRight,
  Flame,
  HelpCircle,
  Percent,
  Layers,
  Repeat,
  Target,
  Trophy,
  ChevronRight
} from 'lucide-react';
import { 
  AccountInfo,
  AutoStrategy, 
  AutoTradeConfig, 
  AutoTradeStats, 
  DigitStats, 
  MarketSymbol, 
  PredictionResult, 
  TradeProposal 
} from '../types';
import { derivWs } from '../services/derivWs';

interface TradingPanelProps {
  currentSymbol: MarketSymbol;
  stats: DigitStats;
  prediction: PredictionResult;
  isSimulated: boolean;
  activeAccountBalance: number;
  currency: string;
  autoConfig: AutoTradeConfig;
  autoStats: AutoTradeStats;
  onUpdateAutoConfig: (newConfig: Partial<AutoTradeConfig>) => void;
  onToggleAutoTrader: () => void;
  onEmergencyStop: () => void;
  onExecuteManualTrade: (contractType: 'DIGITMATCH' | 'DIGITDIFF', barrier: number, stake: number) => Promise<void>;
  isExecutingManual: boolean;
  activeAccount?: AccountInfo | null;
  onOpenSyncModal?: () => void;
}

export const TradingPanel: React.FC<TradingPanelProps> = ({
  currentSymbol,
  stats,
  prediction,
  isSimulated,
  activeAccountBalance,
  currency,
  autoConfig,
  autoStats,
  onUpdateAutoConfig,
  onToggleAutoTrader,
  onEmergencyStop,
  onExecuteManualTrade,
  isExecutingManual,
  activeAccount,
  onOpenSyncModal,
}) => {
  const [activeTab, setActiveTab] = useState<'AUTO' | 'MANUAL'>('AUTO');
  
  // Manual trading state (exclusively MATCHES)
  const [manualBarrier, setManualBarrier] = useState<number>(prediction.recommendedMatch);
  const [manualStake, setManualStake] = useState<number>(1.0);
  const [liveProposal, setLiveProposal] = useState<TradeProposal | null>(null);
  const [isProposalLoading, setIsProposalLoading] = useState<boolean>(false);
  const [isQuantumBoost, setIsQuantumBoost] = useState<boolean>(derivWs.isQuantumBoostEnabled());

  // Apply 2000% Compounding Setup Preset
  const handleApply2000Preset = () => {
    onUpdateAutoConfig({
      strategy: 'SNIPER_2000_YIELD',
      baseStake: 1.0,
      currentStake: 1.0,
      takeProfit: 20.0, // 20x base stake = +2000% return
      stopLoss: 15.0,
      maxConsecutiveLosses: 15,
      intervalTicks: 2,
      autoMatchDigit: true,
    });
  };

  const handleToggleQuantumBoost = () => {
    const next = !isQuantumBoost;
    setIsQuantumBoost(next);
    derivWs.setQuantumBoostMode(next);
  };

  // Quick stake presets
  const stakePresets = [0.5, 1, 2, 5, 10, 25, 50];

  // Update barrier if recommendation changes and user hasn't touched yet
  useEffect(() => {
    if (prediction.recommendedMatch !== undefined) {
      setManualBarrier(prediction.recommendedMatch);
    }
  }, [prediction.recommendedMatch]);

  // Fetch proposal whenever manual params change
  useEffect(() => {
    let isCancelled = false;
    async function fetchProp() {
      setIsProposalLoading(true);
      try {
        const prop = await derivWs.getProposal(
          'DIGITMATCH',
          manualBarrier,
          manualStake,
          currentSymbol.symbol
        );
        if (!isCancelled) {
          setLiveProposal(prop);
        }
      } catch (e) {
        console.error('Proposal error:', e);
      } finally {
        if (!isCancelled) setIsProposalLoading(false);
      }
    }
    fetchProp();
    return () => {
      isCancelled = true;
    };
  }, [manualBarrier, manualStake, currentSymbol.symbol]);

  const syncManualWithPrediction = () => {
    setManualBarrier(prediction.recommendedMatch);
  };

  const handleManualTradeSubmit = async () => {
    if (manualStake > activeAccountBalance && !isSimulated) {
      alert('Stake exceeds available account balance!');
      return;
    }
    await onExecuteManualTrade('DIGITMATCH', manualBarrier, manualStake);
  };

  const hotDigit = stats.hotDigits[0];
  const runnerHot = stats.hotDigits[1];
  const coldDigit = stats.coldDigits[0];

  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden">
      
      {/* Mode Navigation Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/60 p-1.5 gap-1.5">
        <button
          id="tab-auto-trader"
          onClick={() => setActiveTab('AUTO')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'AUTO'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>MATCHES AUTO-TRADER BOT</span>
          {autoConfig.enabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          )}
        </button>

        <button
          id="tab-manual-trader"
          onClick={() => setActiveTab('MANUAL')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'MANUAL'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>MANUAL MATCH TRADING (850% PAYOUT)</span>
        </button>
      </div>

      {/* Live Account Status Bar */}
      <div className="px-5 py-2.5 bg-slate-950/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          {activeAccount ? (
            <>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                !activeAccount.isVirtual
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {!activeAccount.isVirtual ? 'DERIV REAL' : 'DERIV DEMO'}
              </span>
              <span className="font-mono font-bold text-slate-200">{activeAccount.account}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">Balance:</span>
              <span className="font-mono font-bold text-emerald-400">
                ${activeAccountBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
              </span>
            </>
          ) : (
            <>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                DEMO TRADER
              </span>
              <span className="font-mono font-bold text-slate-200">Virtual Demo</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">Balance:</span>
              <span className="font-mono font-bold text-emerald-400">
                ${activeAccountBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
              </span>
            </>
          )}
        </div>

        {onOpenSyncModal && (
          <button
            onClick={onOpenSyncModal}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
          >
            {activeAccount ? (
              <>
                <span>Account Settings</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Connect API Key</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        )}
      </div>

      <div className="p-5">
        {activeTab === 'AUTO' ? (
          /* ================= AUTO TRADING BOT VIEW ================= */
          <div className="space-y-5">
            
            {/* Bot Status & Session Overview Bar */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${
                  autoConfig.enabled
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400'
                }`}>
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Matches Bot Engine</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      autoConfig.enabled
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {autoConfig.enabled ? 'ACTIVE HUNTING' : autoStats.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {autoConfig.enabled 
                      ? `Hunting ${autoConfig.strategy} for 850% Match payouts on ${currentSymbol.displayName}` 
                      : autoStats.stopReason || 'Configure parameters and launch automated Matches bot'}
                  </p>
                </div>
              </div>

              {/* Session Live Statistics */}
              <div className="flex items-center gap-4 text-xs">
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 font-medium">Session P&L</div>
                  <div className={`font-mono font-bold text-base ${
                    autoStats.totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {autoStats.totalProfit >= 0 ? '+' : ''}${autoStats.totalProfit.toFixed(2)}
                  </div>
                </div>

                <div className="h-8 w-px bg-slate-800" />

                <div className="text-right">
                  <div className="text-[10px] text-slate-500 font-medium">Match Hits / Misses</div>
                  <div className="font-mono font-bold text-slate-200">
                    <span className="text-emerald-400">{autoStats.wonTrades} Hits</span>
                    <span className="text-slate-600"> / </span>
                    <span className="text-slate-400">{autoStats.lostTrades} Miss</span>
                  </div>
                </div>

                <div className="h-8 w-px bg-slate-800" />

                <div className="text-right">
                  <div className="text-[10px] text-slate-500 font-medium">Hit Rate</div>
                  <div className="font-mono font-bold text-rose-400">
                    {autoStats.totalTrades > 0 
                      ? ((autoStats.wonTrades / autoStats.totalTrades) * 100).toFixed(1) 
                      : '0.0'}%
                  </div>
                </div>
              </div>
            </div>

            {/* 2000% Compounding ROI Ladder & Target Progress Meter */}
            <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-rose-950/40 border border-amber-500/30 rounded-xl p-4 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black tracking-wider text-amber-300 uppercase">2000% Compounding ROI Ladder</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Target: 20x Return
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Matches payout (~850%) compounds to +2000% gain in 2-3 consecutive strikes.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">

                  <button
                    onClick={handleApply2000Preset}
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Target className="w-3.5 h-3.5" />
                    <span>Load 2000% Setup</span>
                  </button>
                </div>
              </div>

              {/* Progress Bar & Milestone Ladder */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <div className="flex items-center gap-1 text-slate-300">
                    <span>Session Growth:</span>
                    <span className={`font-bold ${autoStats.sessionRoiPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {autoStats.sessionRoiPercent >= 0 ? '+' : ''}{autoStats.sessionRoiPercent}% ROI
                    </span>
                  </div>
                  <div className="text-amber-400 font-bold">
                    {autoStats.sessionRoiPercent >= 2000 ? '🎉 2000% TARGET REACHED!' : `${Math.min(100, Math.max(0, (autoStats.sessionRoiPercent / 2000) * 100)).toFixed(0)}% towards 2000%`}
                  </div>
                </div>

                {/* Visual Bar */}
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, (autoStats.sessionRoiPercent / 2000) * 100))}%` }}
                  />
                </div>

                {/* Milestone Markers */}
                <div className="grid grid-cols-4 gap-1 text-[9px] font-mono text-center pt-1">
                  <div className={`py-0.5 rounded ${autoStats.sessionRoiPercent >= 500 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-950/60 text-slate-500'}`}>
                    Tier 1: +500%
                  </div>
                  <div className={`py-0.5 rounded ${autoStats.sessionRoiPercent >= 1000 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-950/60 text-slate-500'}`}>
                    Tier 2: +1000%
                  </div>
                  <div className={`py-0.5 rounded ${autoStats.sessionRoiPercent >= 1500 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-950/60 text-slate-500'}`}>
                    Tier 3: +1500%
                  </div>
                  <div className={`py-0.5 rounded ${autoStats.sessionRoiPercent >= 2000 ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50 font-bold animate-pulse' : 'bg-slate-950/60 text-slate-500'}`}>
                    Goal: +2000%
                  </div>
                </div>
              </div>
            </div>

            {/* Auto Matches Strategy Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-rose-400" />
                  Select Matches Auto-Strategy
                </label>
                <span className="text-[11px] text-slate-500">Every strategy executes high-multiplier DIGITMATCH contracts</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
                
                {/* 2000% Quantum Sniper Match */}
                <div
                  onClick={() => onUpdateAutoConfig({ strategy: 'SNIPER_2000_YIELD' })}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    autoConfig.strategy === 'SNIPER_2000_YIELD'
                      ? 'bg-amber-950/50 border-amber-400 shadow-md shadow-amber-500/20 ring-1 ring-amber-400/50'
                      : 'bg-gradient-to-br from-amber-950/20 to-slate-950/60 border-amber-500/30 hover:border-amber-400/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-amber-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>2000% Sniper</span>
                    </span>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-200 border border-amber-500/40">
                      2000% YIELD
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Triple convergence sniper. Synchronizes Markov peak, hot cluster & streak resonance targeting +2000% compounding.
                  </p>
                </div>

                {/* Hot Momentum Match */}
                <div
                  onClick={() => onUpdateAutoConfig({ strategy: 'HOT_MOMENTUM_MATCH' })}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    autoConfig.strategy === 'HOT_MOMENTUM_MATCH'
                      ? 'bg-rose-950/40 border-rose-500 shadow-md shadow-rose-500/10'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-rose-300">Hot Momentum</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                      850% Payout
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Hunts peak momentum clusters and bets MATCHES on the highest frequency digit ({stats.percentages[hotDigit] || 0}%).
                  </p>
                </div>

                {/* Repeat Streak Match */}
                <div
                  onClick={() => onUpdateAutoConfig({ strategy: 'REPEAT_STREAK_MATCH' })}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    autoConfig.strategy === 'REPEAT_STREAK_MATCH'
                      ? 'bg-amber-950/40 border-amber-500 shadow-md shadow-amber-500/10'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-amber-300">Repeat & Twin Match</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      Streak Hunt
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Catches rapid digit duplicates and bets MATCHES immediately on consecutive digit recurrences.
                  </p>
                </div>

                {/* Markov Spike Match */}
                <div
                  onClick={() => onUpdateAutoConfig({ strategy: 'MARKOV_SPIKE_MATCH' })}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    autoConfig.strategy === 'MARKOV_SPIKE_MATCH'
                      ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-500/10'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-indigo-300">Markov Transition</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      Matrix Spike
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Calculates conditional probability P(next|current) and matches the highest transition spike.
                  </p>
                </div>

                {/* Cold Reversal Breakout */}
                <div
                  onClick={() => onUpdateAutoConfig({ strategy: 'COLD_REVERSAL_MATCH' })}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    autoConfig.strategy === 'COLD_REVERSAL_MATCH'
                      ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/10'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-emerald-300">Reversal Breakout</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      Mean Reversion
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Targets dormant overdue digits with severe deviation ({stats.percentages[coldDigit] || 0}%) anticipating breakout.
                  </p>
                </div>

                {/* Dynamic AI Match */}
                <div
                  onClick={() => onUpdateAutoConfig({ strategy: 'DYNAMIC_AI_MATCH' })}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    autoConfig.strategy === 'DYNAMIC_AI_MATCH'
                      ? 'bg-purple-950/40 border-purple-500 shadow-md shadow-purple-500/10'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-purple-300">Dynamic AI Match</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                      Adaptive
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Continuously weighs momentum, transition entropy, and AI scoring to pick the #1 Match target.
                  </p>
                </div>

              </div>
            </div>

            {/* Auto Match Parameters & Risk Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
              
              {/* Stake & Matches Progression */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Base Stake (${currency})</span>
                    <span className="text-[11px] text-slate-500">Min $0.35</span>
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-2 text-xs text-slate-500">$</span>
                    <input
                      type="number"
                      min="0.35"
                      step="0.5"
                      value={autoConfig.baseStake}
                      onChange={(e) => onUpdateAutoConfig({ baseStake: Math.max(0.35, parseFloat(e.target.value) || 1) })}
                      disabled={autoConfig.enabled}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-6 pr-3 py-1.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">Matches Stake Progression</label>
                    <span className="text-[10px] text-rose-400 font-mono">
                      {autoConfig.martingaleMultiplier === 1 ? 'Flat Stake (1.0x)' : `${autoConfig.martingaleMultiplier}x multiplier`}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 mt-1">
                    {[1.0, 1.2, 1.5].map((mult) => (
                      <button
                        key={mult}
                        disabled={autoConfig.enabled}
                        onClick={() => onUpdateAutoConfig({ martingaleMultiplier: mult })}
                        className={`py-1 px-2 rounded text-[11px] font-mono font-bold border transition-colors cursor-pointer ${
                          autoConfig.martingaleMultiplier === mult
                            ? 'bg-rose-600 border-rose-500 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {mult === 1.0 ? 'Flat (1.0x)' : `${mult}x`}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Matches pay ~850% profit (1 win covers ~8-9 past stakes even with flat stake).
                  </p>
                </div>
              </div>

              {/* Take Profit & Stop Loss */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span className="text-emerald-400 font-bold">Take Profit Target ($)</span>
                    <span className="text-[10px] text-slate-500">Auto-stops bot</span>
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-2 text-xs text-slate-500">$</span>
                    <input
                      type="number"
                      min="1"
                      step="5"
                      value={autoConfig.takeProfit}
                      onChange={(e) => onUpdateAutoConfig({ takeProfit: Math.max(1, parseFloat(e.target.value) || 10) })}
                      disabled={autoConfig.enabled}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-6 pr-3 py-1.5 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span className="text-rose-400 font-bold">Stop Loss Limit ($)</span>
                    <span className="text-[10px] text-slate-500">Drawdown breaker</span>
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-2 text-xs text-slate-500">$</span>
                    <input
                      type="number"
                      min="5"
                      step="5"
                      value={autoConfig.stopLoss}
                      onChange={(e) => onUpdateAutoConfig({ stopLoss: Math.max(1, parseFloat(e.target.value) || 20) })}
                      disabled={autoConfig.enabled}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-6 pr-3 py-1.5 text-xs font-mono font-bold text-rose-400 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* Safety Breakers & Interval */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Max Consecutive Losses</span>
                    <span className="text-[10px] text-amber-400 font-mono">Safety Breaker</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="25"
                    value={autoConfig.maxConsecutiveLosses}
                    onChange={(e) => onUpdateAutoConfig({ maxConsecutiveLosses: Math.max(1, parseInt(e.target.value, 10) || 8) })}
                    disabled={autoConfig.enabled}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-rose-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Recommended: 8-15 for high payout Matches hunting</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Trade Interval (Ticks)</span>
                    <span className="text-[10px] text-slate-500">Delay</span>
                  </label>
                  <select
                    value={autoConfig.intervalTicks}
                    onChange={(e) => onUpdateAutoConfig({ intervalTicks: parseInt(e.target.value, 10) || 1 })}
                    disabled={autoConfig.enabled}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value={1}>Every 1 Tick (Fast Momentum)</option>
                    <option value={2}>Every 2 Ticks</option>
                    <option value={3}>Every 3 Ticks (Recommended)</option>
                    <option value={5}>Every 5 Ticks (Filtered)</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Launch / Halt Bot Controls */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                id="btn-toggle-autotrader"
                onClick={onToggleAutoTrader}
                className={`w-full sm:flex-1 py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer ${
                  autoConfig.enabled
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                }`}
              >
                {autoConfig.enabled ? (
                  <>
                    <Square className="w-4 h-4 fill-white" />
                    <span>STOP MATCHES AUTO-TRADER</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>START MATCHES AUTO-TRADER BOT</span>
                  </>
                )}
              </button>

              {autoConfig.enabled && (
                <button
                  id="btn-emergency-stop"
                  onClick={onEmergencyStop}
                  className="w-full sm:w-auto py-3.5 px-5 rounded-xl bg-red-950 border border-red-500/40 hover:bg-red-900 text-red-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <AlertOctagon className="w-4 h-4 text-red-400" />
                  <span>EMERGENCY HALT</span>
                </button>
              )}
            </div>

          </div>
        ) : (
          /* ================= MANUAL MATCHES TRADING VIEW ================= */
          <div className="space-y-5">
            
            {/* Header / Contract Focus Card */}
            <div className="bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border border-rose-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      CONTRACT TYPE: DIGIT MATCH
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      ~850% NET RETURN
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    You win 8.5x-9.2x your stake if the final tick's exit digit matches your chosen digit.
                  </p>
                </div>
              </div>

              <button
                onClick={syncManualWithPrediction}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/40 text-rose-200 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5 text-rose-300" />
                <span>Sync with Top Match ({prediction.recommendedMatch})</span>
              </button>
            </div>

            {/* Target Digit Selector (0-9) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Select Target Digit to Match (0 - 9)
                </label>
                <span className="text-[11px] text-slate-400">
                  Selected Digit: <strong className="text-rose-400 font-mono text-sm">{manualBarrier}</strong>
                </span>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => {
                  const isSelected = manualBarrier === digit;
                  const isHot = digit === hotDigit;
                  const isRunner = digit === runnerHot;
                  const isLast = stats.lastDigit === digit;
                  const perc = stats.percentages[digit] || 0;

                  return (
                    <button
                      key={`keypad-digit-${digit}`}
                      onClick={() => setManualBarrier(digit)}
                      className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-rose-600 border-rose-400 text-white shadow-lg shadow-rose-600/30 scale-105 ring-2 ring-rose-400/50'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <span className="text-lg font-bold font-mono">{digit}</span>
                      <span className={`text-[9px] font-mono mt-0.5 ${
                        isSelected ? 'text-white/90 font-bold' : 'text-slate-500'
                      }`}>
                        {perc}%
                      </span>
                      {isHot && !isSelected && (
                        <span className="absolute -top-1 -right-1 px-1 py-0.2 rounded text-[7px] font-bold bg-rose-500 text-white shadow">
                          HOT
                        </span>
                      )}
                      {isLast && !isSelected && !isHot && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stake Configuration */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Stake Amount (${currency})
                </label>
                <span className="text-[11px] text-slate-400">
                  Available Balance: <span className="font-mono font-bold text-white">${activeAccountBalance.toFixed(2)}</span>
                </span>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono">$</span>
                  <input
                    type="number"
                    min="0.35"
                    step="0.5"
                    value={manualStake}
                    onChange={(e) => setManualStake(Math.max(0.35, parseFloat(e.target.value) || 1))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 font-mono">
                  Duration: 1 Tick
                </div>
              </div>

              {/* Stake Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                {stakePresets.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setManualStake(amount)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                      manualStake === amount
                        ? 'bg-rose-600 border-rose-500 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Proposal & Return Preview */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400 font-medium">Estimated Payout (Match Win)</div>
                <div className="text-xl font-bold font-mono text-white mt-0.5">
                  ${liveProposal ? liveProposal.payout.toFixed(2) : (manualStake * 9.2).toFixed(2)}
                </div>
              </div>

              <div className="text-right">
                <div className="text-[11px] text-slate-400 font-medium">Net Profit on Match Hit</div>
                <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                  +${liveProposal ? (liveProposal.payout - manualStake).toFixed(2) : (manualStake * 8.2).toFixed(2)}
                  <span className="text-xs text-slate-400 ml-1">
                    ({liveProposal ? liveProposal.returnPercentage : 820}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Execute Manual Trade Button */}
            <button
              id="btn-execute-manual-trade"
              onClick={handleManualTradeSubmit}
              disabled={isExecutingManual}
              className="w-full py-4 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xl bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {isExecutingManual ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>PURCHASING MATCH CONTRACT...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>
                    BUY MATCH (TARGET DIGIT {manualBarrier}) - ${manualStake}
                  </span>
                </>
              )}
            </button>

          </div>
        )}
      </div>

    </div>
  );
};
