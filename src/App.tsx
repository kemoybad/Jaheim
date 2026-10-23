import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { DigitTape } from './components/DigitTape';
import { TradingPanel } from './components/TradingPanel';
import { TradeHistory } from './components/TradeHistory';
import { OAuthSyncModal } from './components/OAuthSyncModal';
import { 
  AccountInfo, 
  AutoTradeConfig, 
  AutoTradeStats, 
  DigitStats, 
  MarketSymbol, 
  PredictionResult, 
  TickData, 
  TradeContract 
} from './types';
import { POPULAR_SYMBOLS, computeDigitStats, predictOptions } from './services/analyzer';
import { derivWs } from './services/derivWs';
import { soundFx } from './utils/audio';

export default function App() {
  // Market state
  const [currentSymbol, setCurrentSymbol] = useState<MarketSymbol>(POPULAR_SYMBOLS[0]);
  const [ticks, setTicks] = useState<TickData[]>([]);
  const [selectedSampleCount, setSelectedSampleCount] = useState<number>(100);

  // Deriv connection & accounts
  const [connectionStatus, setConnectionStatus] = useState<any>('CONNECTING');
  const [activeAccount, setActiveAccount] = useState<AccountInfo | null>(derivWs.activeAccount);
  const [allAccounts, setAllAccounts] = useState<AccountInfo[]>(derivWs.allAccounts);
  const [balance, setBalance] = useState<number>(derivWs.getSimulatedBalance());
  const [currency, setCurrency] = useState<string>('USD');
  const [isSimulated, setIsSimulated] = useState<boolean>(derivWs.isSimulated);

  // Modal & AI state
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiPrediction, setAiPrediction] = useState<Partial<PredictionResult> | null>(null);

  // Trades record
  const [trades, setTrades] = useState<TradeContract[]>(() => {
    try {
      const saved = localStorage.getItem('deriv_trade_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isExecutingManual, setIsExecutingManual] = useState<boolean>(false);

  // Auto-trading Bot Configuration
  const [autoConfig, setAutoConfig] = useState<AutoTradeConfig>({
    enabled: false,
    strategy: 'HOT_MOMENTUM_MATCH',
    baseStake: 1.0,
    currentStake: 1.0,
    autoMatchDigit: true,
    manualTargetDigit: 7,
    martingaleMultiplier: 1.0, // Matches contracts yield ~850% payout; flat stake is default
    takeProfit: 10.0,
    stopLoss: 25.0,
    maxConsecutiveLosses: 12,
    maxTrades: 50,
    intervalTicks: 2,
    repeatThreshold: 1,
  });

  // Auto-trading Bot Statistics
  const [autoStats, setAutoStats] = useState<AutoTradeStats>({
    totalTrades: 0,
    wonTrades: 0,
    lostTrades: 0,
    consecutiveLosses: 0,
    maxConsecutiveLosses: 0,
    consecutiveWins: 0,
    totalProfit: 0,
    sessionRoiPercent: 0,
    status: 'IDLE',
  });

  // References to keep event handlers fresh without re-binding
  const autoConfigRef = useRef(autoConfig);
  autoConfigRef.current = autoConfig;

  const autoStatsRef = useRef(autoStats);
  autoStatsRef.current = autoStats;

  const isTradeInFlightRef = useRef(false);
  const ticksSinceLastTradeRef = useRef(0);

  // Connect to Deriv WebSocket on mount & sync connection
  useEffect(() => {
    const unsubStatus = derivWs.onStatusChange((s) => setConnectionStatus(s));
    const unsubBalance = derivWs.onBalanceChange((bal, cur) => {
      setBalance(bal);
      setCurrency(cur);
      setIsSimulated(derivWs.isSimulated);
    });
    const unsubAccounts = derivWs.onAccountsChange((accts) => {
      setAllAccounts(accts);
      setActiveAccount(derivWs.activeAccount);
      setIsSimulated(derivWs.isSimulated);
    });
    // Start connection
    derivWs.connect();

    // Sync initial state from derivWs
    if (derivWs.activeAccount) {
      setActiveAccount(derivWs.activeAccount);
      setIsSimulated(derivWs.isSimulated);
    }
    setAllAccounts(derivWs.allAccounts);

    return () => {
      unsubStatus();
      unsubBalance();
      unsubAccounts();
    };
  }, []);

  // Update ticks when new tick arrives from Deriv stream
  useEffect(() => {
    const unsubTick = derivWs.onTick((newTick) => {
      soundFx.playTick();
      setTicks((prev) => {
        const next = [...prev, newTick];
        if (next.length > 1000) {
          return next.slice(-1000);
        }
        return next;
      });

      // Handle auto-trading trigger on tick
      handleAutoTradeTick(newTick);
    });

    return () => {
      unsubTick();
    };
  }, [currentSymbol.symbol]);

  // Handle contract outcomes
  useEffect(() => {
    const unsubContract = derivWs.onContractComplete((contract) => {
      isTradeInFlightRef.current = false;
      ticksSinceLastTradeRef.current = 0;

      // Update trade history
      setTrades((prev) => {
        const updated = [contract, ...prev.slice(0, 499)];
        try {
          localStorage.setItem('deriv_trade_history', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      const isWon = contract.status === 'won';

      if (isWon) {
        soundFx.playWin();
        confetti({
          particleCount: 35,
          spread: 50,
          origin: { y: 0.85 },
        });
      } else {
        soundFx.playLoss();
      }

      // If this was an auto-trade, update bot stats
      if (contract.isAuto) {
        const currentStats = autoStatsRef.current;
        const currentConf = autoConfigRef.current;

        const newProfit = Number((currentStats.totalProfit + contract.profit).toFixed(2));
        const newWon = currentStats.wonTrades + (isWon ? 1 : 0);
        const newLost = currentStats.lostTrades + (isWon ? 0 : 1);
        const newConsecWins = isWon ? currentStats.consecutiveWins + 1 : 0;
        const newConsecLosses = isWon ? 0 : currentStats.consecutiveLosses + 1;
        const maxLosses = Math.max(currentStats.maxConsecutiveLosses, newConsecLosses);
        const total = currentStats.totalTrades + 1;
        const sessionRoi = Number(((newProfit / Math.max(0.35, currentConf.baseStake)) * 100).toFixed(1));

        // Martingale stake progression
        let nextStake = currentConf.baseStake;
        if (!isWon && currentConf.martingaleMultiplier > 1) {
          nextStake = Number((currentConf.currentStake * currentConf.martingaleMultiplier).toFixed(2));
        }

        // Check safety rules & 2000% Target Compounding
        let shouldStop = false;
        let stopReason = '';

        if (newProfit >= currentConf.takeProfit || (currentConf.strategy === 'SNIPER_2000_YIELD' && sessionRoi >= 2000)) {
          shouldStop = true;
          stopReason = sessionRoi >= 2000
            ? `Target 2000% ROI compounding reached (+${newProfit.toFixed(2)} | ${sessionRoi}% ROI)! Bot locked in gains.`
            : `Take Profit hit (+${newProfit.toFixed(2)})! Auto-trader secured gains.`;
        } else if (newProfit <= -currentConf.stopLoss) {
          shouldStop = true;
          stopReason = `Stop Loss threshold reached (-${Math.abs(newProfit).toFixed(2)}). Bot halted.`;
        } else if (newConsecLosses >= currentConf.maxConsecutiveLosses) {
          shouldStop = true;
          stopReason = `Max consecutive losses (${newConsecLosses}) safety breaker tripped.`;
        } else if (total >= currentConf.maxTrades) {
          shouldStop = true;
          stopReason = `Max trade limit (${currentConf.maxTrades}) achieved.`;
        }

        if (shouldStop) {
          soundFx.playAlert();
          setAutoConfig((c) => ({ ...c, enabled: false, currentStake: currentConf.baseStake }));
          setAutoStats({
            totalTrades: total,
            wonTrades: newWon,
            lostTrades: newLost,
            consecutiveWins: newConsecWins,
            consecutiveLosses: newConsecLosses,
            maxConsecutiveLosses: maxLosses,
            totalProfit: newProfit,
            sessionRoiPercent: sessionRoi,
            status: 'STOPPED_TP',
            stopReason,
          });
        } else {
          setAutoConfig((c) => ({ ...c, currentStake: nextStake }));
          setAutoStats((s) => ({
            ...s,
            totalTrades: total,
            wonTrades: newWon,
            lostTrades: newLost,
            consecutiveWins: newConsecWins,
            consecutiveLosses: newConsecLosses,
            maxConsecutiveLosses: maxLosses,
            totalProfit: newProfit,
            sessionRoiPercent: sessionRoi,
          }));
        }
      }
    });

    return () => {
      unsubContract();
    };
  }, []);

  // Compute active statistics over selected sample count
  const sampleTicks = ticks.slice(-selectedSampleCount);
  const stats: DigitStats = computeDigitStats(sampleTicks);
  const basePrediction = predictOptions(stats, sampleTicks.map((t) => t.digit));

  // Merge base prediction with any custom Gemini AI insights
  const prediction: PredictionResult = {
    ...basePrediction,
    ...(aiPrediction || {}),
  };

  // Change symbol handler
  const handleSelectSymbol = (newSymbol: MarketSymbol) => {
    if (newSymbol.symbol === currentSymbol.symbol) return;
    setCurrentSymbol(newSymbol);
    setTicks([]);
    derivWs.subscribeTicks(newSymbol.symbol, newSymbol.pipSize);
  };

  // Auto-Trading Bot execution engine
  const handleAutoTradeTick = useCallback((tick: TickData) => {
    const config = autoConfigRef.current;
    if (!config.enabled) return;
    if (isTradeInFlightRef.current) return;

    ticksSinceLastTradeRef.current += 1;
    if (ticksSinceLastTradeRef.current < config.intervalTicks) {
      return;
    }

    // Evaluate Matches strategy condition & target barrier digit
    const contractType: 'DIGITMATCH' = 'DIGITMATCH';
    let targetBarrier: number = prediction.recommendedMatch;
    let shouldExecute = false;

    if (config.strategy === 'SNIPER_2000_YIELD') {
      // 2000% Quantum Sniper: Prioritizes triple convergence digit or top resonant match
      targetBarrier = prediction.convergenceDigit ?? prediction.recommendedMatch;
      shouldExecute = true;
    } else if (config.strategy === 'HOT_MOMENTUM_MATCH') {
      targetBarrier = prediction.recommendedMatch;
      shouldExecute = true;
    } else if (config.strategy === 'REPEAT_STREAK_MATCH') {
      // Hunt repeat twins / clusters: if active repeat or twin, target that digit
      if (stats.streakType === 'repeat' && stats.streakDigit !== null) {
        targetBarrier = stats.streakDigit;
        shouldExecute = true;
      } else if (stats.lastDigit !== null) {
        // Bet on recurrence of the current tick digit
        targetBarrier = stats.lastDigit;
        shouldExecute = true;
      }
    } else if (config.strategy === 'MARKOV_SPIKE_MATCH') {
      targetBarrier = prediction.recommendedMatch;
      shouldExecute = true;
    } else if (config.strategy === 'COLD_REVERSAL_MATCH') {
      // Reversal target on overdue cold digit
      targetBarrier = stats.coldDigits[0] ?? 0;
      shouldExecute = true;
    } else if (config.strategy === 'DYNAMIC_AI_MATCH') {
      // Dynamic: routes to top recommended match candidate
      targetBarrier = prediction.recommendedMatch;
      shouldExecute = true;
    }

    if (shouldExecute) {
      isTradeInFlightRef.current = true;
      const stake = config.currentStake || config.baseStake;

      derivWs.executeTrade(contractType, targetBarrier, stake, true, currentSymbol.symbol)
        .catch((err) => {
          console.error('Auto-trade execution failed:', err);
          isTradeInFlightRef.current = false;
        });
    }
  }, [currentSymbol.symbol, prediction, stats]);

  // Manual Trade Handler
  const handleManualTrade = async (contractType: 'DIGITMATCH' | 'DIGITDIFF', barrier: number, stake: number) => {
    setIsExecutingManual(true);
    try {
      await derivWs.executeTrade(contractType, barrier, stake, false, currentSymbol.symbol);
    } catch (err: any) {
      alert(`Trade error: ${err.message}`);
    } finally {
      setIsExecutingManual(false);
    }
  };

  // Toggle Auto-Trader
  const handleToggleAutoTrader = () => {
    if (!autoConfig.enabled) {
      // Reset session stats
      setAutoStats((s) => ({
        ...s,
        totalTrades: 0,
        wonTrades: 0,
        lostTrades: 0,
        consecutiveWins: 0,
        consecutiveLosses: 0,
        totalProfit: 0,
        sessionRoiPercent: 0,
        status: 'RUNNING',
        stopReason: undefined,
      }));
      setAutoConfig((c) => ({ ...c, enabled: true, currentStake: c.baseStake }));
      soundFx.playAlert();
    } else {
      setAutoConfig((c) => ({ ...c, enabled: false }));
      setAutoStats((s) => ({ ...s, status: 'PAUSED' }));
    }
  };

  // Emergency Halt
  const handleEmergencyStop = () => {
    setAutoConfig((c) => ({ ...c, enabled: false }));
    setAutoStats((s) => ({ ...s, status: 'PAUSED', stopReason: 'Emergency stop activated by user.' }));
    soundFx.playAlert();
  };

  // Gemini AI Analysis fetcher
  const handleRefreshAiAnalysis = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: currentSymbol.displayName,
          recentDigits: ticks.slice(-40).map((t) => t.digit),
          frequency: stats.percentages,
          stats: {
            currentStreak: stats.streakCount,
            streakType: stats.streakType,
            oddRatio: stats.oddRatio,
            evenRatio: stats.evenRatio,
            underRatio: stats.underRatio,
            overRatio: stats.overRatio,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiPrediction({
          aiSummary: data.summary,
          tacticalTip: data.tacticalTip,
          riskLevel: data.riskLevel || 'STABLE',
          matchReason: data.matchRecommendation?.reason || basePrediction.matchReason,
          recommendedMatch: data.matchRecommendation?.digit ?? basePrediction.recommendedMatch,
          matchConfidence: data.matchRecommendation?.confidence ?? basePrediction.matchConfidence,
          topMatchCandidates: data.topMatchCandidates || basePrediction.topMatchCandidates,
          source: data.source || 'gemini',
        });
      }
    } catch (e) {
      console.error('AI Analysis failed:', e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleLogout = () => {
    derivWs.logout();
    setActiveAccount(null);
    setAllAccounts([]);
    setIsSimulated(true);
    soundFx.playAlert();
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-rose-500/30 selection:text-rose-200">
      
      {/* Top Navigation Bar */}
      <Header
        currentSymbol={currentSymbol}
        onSelectSymbol={handleSelectSymbol}
        status={connectionStatus}
        activeAccount={activeAccount}
        allAccounts={allAccounts}
        balance={balance}
        currency={currency}
        isSimulated={isSimulated}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onSwitchAccount={(acc) => {
          derivWs.switchAccount(acc);
          setActiveAccount(acc);
        }}
        onEnableSimulator={() => {
          derivWs.enableSimulatorMode();
          setIsSimulated(true);
          setActiveAccount(null);
        }}
        onResetSimulatedBalance={() => {
          derivWs.resetSimulatedBalance(10000);
          setBalance(10000);
        }}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-6">
        
        {/* Real-time Ticker & Digit Stream Tape */}
        <DigitTape
          currentSymbol={currentSymbol}
          ticks={ticks}
          stats={stats}
        />

        {/* Execution Engine (Auto Trader Bot & Manual Trader) */}
        <TradingPanel
          currentSymbol={currentSymbol}
          stats={stats}
          prediction={prediction}
          isSimulated={isSimulated}
          activeAccountBalance={balance}
          currency={currency}
          autoConfig={autoConfig}
          autoStats={autoStats}
          onUpdateAutoConfig={(patch) => setAutoConfig((c) => ({ ...c, ...patch }))}
          onToggleAutoTrader={handleToggleAutoTrader}
          onEmergencyStop={handleEmergencyStop}
          onExecuteManualTrade={handleManualTrade}
          isExecutingManual={isExecutingManual}
          activeAccount={activeAccount}
          onOpenSyncModal={() => setIsSyncModalOpen(true)}
        />

        {/* Trade Journal & History */}
        <TradeHistory
          trades={trades}
          onClearHistory={() => {
            setTrades([]);
            localStorage.removeItem('deriv_trade_history');
          }}
        />

      </main>

      {/* Deriv Account & API Key Modal */}
      <OAuthSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        allAccounts={allAccounts}
        activeAccount={activeAccount}
        onSelectAccount={(acc) => {
          setActiveAccount(acc);
          setIsSimulated(false);
        }}
        onEnableSimulator={() => {
          derivWs.enableSimulatorMode();
          setIsSimulated(true);
          setActiveAccount(null);
        }}
        onAccountsUpdated={(accts) => setAllAccounts(accts)}
        onLogout={handleLogout}
      />

      {/* Modern Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-4 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Deriv Quantitative Digit Analysis & Automated Prediction Engine • Matches Trading
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-400">WebSocket API: v3</span>
            <span>•</span>
            <span className="text-emerald-400">Live Tick Feed</span>
            <span>•</span>
            <span className="text-slate-400">Demo & Real Supported</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
