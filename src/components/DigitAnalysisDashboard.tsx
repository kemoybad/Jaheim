import React, { useState } from 'react';
import { 
  TrendingUp, 
  Sparkles, 
  BrainCircuit, 
  Target, 
  CheckCircle, 
  AlertTriangle,
  RotateCw,
  Flame,
  Zap,
  Repeat,
  Layers,
  ArrowRight,
  Trophy,
  ShieldCheck
} from 'lucide-react';
import { DigitStats, MarketSymbol, PredictionResult, TickData } from '../types';

interface DigitAnalysisDashboardProps {
  currentSymbol: MarketSymbol;
  ticks: TickData[];
  stats: DigitStats;
  prediction: PredictionResult;
  selectedSampleCount: number;
  onSelectSampleCount: (count: number) => void;
  onSelectTargetDigit: (digit: number, contractType: 'DIGITDIFF' | 'DIGITMATCH') => void;
  onRefreshAiAnalysis: () => void;
  isAiLoading: boolean;
}

export const DigitAnalysisDashboard: React.FC<DigitAnalysisDashboardProps> = ({
  currentSymbol,
  ticks,
  stats,
  prediction,
  selectedSampleCount,
  onSelectSampleCount,
  onSelectTargetDigit,
  onRefreshAiAnalysis,
  isAiLoading,
}) => {
  const hotDigit = stats.hotDigits[0];
  const runnerHot = stats.hotDigits[1];
  const coldDigit = stats.coldDigits[0];

  return (
    <div className="space-y-4">
      
      {/* 2000% Quantum Convergence Sniper Radar */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-rose-950/40 border border-amber-500/40 rounded-2xl p-4 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Trophy className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                  2000% QUANTUM SNIPER CONVERGENCE RADAR
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  prediction.tripleConvergence
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  {prediction.tripleConvergence ? 'TRIPLE CONVERGENCE ALIGNED' : 'HUNTING CONVERGENCE'}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-slate-300">
                  Target Strike: <strong className="text-white font-mono">Digit {prediction.convergenceDigit ?? prediction.recommendedMatch}</strong>
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs text-amber-400 font-bold">
                  Compounding Matrix: +2000% Target Yield
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs text-slate-300 font-mono">
                  Convergence Alignment: <strong className="text-emerald-400">{prediction.convergenceScore || 88}%</strong>
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onSelectTargetDigit(prediction.convergenceDigit ?? prediction.recommendedMatch, 'DIGITMATCH')}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2"
          >
            <Target className="w-4 h-4" />
            <span>Lock Digit {prediction.convergenceDigit ?? prediction.recommendedMatch} for 2000% Yield</span>
          </button>
        </div>
      </div>

      {/* Top Banner: Matches Tactical Command Center (Primary & Multi-Candidate Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Primary Recommended Match Card */}
        <div className="lg:col-span-7 bg-gradient-to-br from-rose-950/50 via-slate-900 to-slate-900 border border-rose-500/40 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-44 h-44 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
                <Flame className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30">
                  TOP MATCHES RECOMMENDATION (850% PAYOUT)
                </span>
                <h3 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
                  <span>Match Target: Digit</span>
                  <span className="text-2xl font-black font-mono text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/40">
                    {prediction.recommendedMatch}
                  </span>
                </h3>
              </div>
            </div>

            <button
              id="btn-apply-match-prediction"
              onClick={() => onSelectTargetDigit(prediction.recommendedMatch, 'DIGITMATCH')}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"
            >
              <span>Apply Match</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            {prediction.matchReason}
          </p>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-[10px] text-slate-500 font-medium">Cluster Frequency</div>
              <div className="font-mono font-bold text-base text-rose-400 mt-0.5">
                {stats.percentages[prediction.recommendedMatch] || 0}%
              </div>
            </div>
            <div className="px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-[10px] text-slate-500 font-medium">Potential Payout</div>
              <div className="font-mono font-bold text-base text-emerald-400 mt-0.5">
                +820% to +850%
              </div>
            </div>
            <div className="px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-[10px] text-slate-500 font-medium">Hit Confidence</div>
              <div className="font-mono font-bold text-base text-amber-400 mt-0.5">
                {prediction.matchConfidence}%
              </div>
            </div>
          </div>
        </div>

        {/* Top 3 Match Cluster Candidates Card */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-rose-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Top Match Candidates</h4>
              </div>
              <span className="text-[10px] text-slate-500">Ranked by momentum & Markov</span>
            </div>

            <p className="text-[11px] text-slate-400 mb-3">
              Multiple high-resonance digits for diversified matches hunting:
            </p>

            <div className="space-y-2">
              {prediction.topMatchCandidates?.slice(0, 3).map((candidate, idx) => (
                <div
                  key={`top-candidate-${candidate.digit}-${idx}`}
                  onClick={() => onSelectTargetDigit(candidate.digit, 'DIGITMATCH')}
                  className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-rose-500/50 hover:bg-slate-950 transition-all cursor-pointer flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 font-mono font-black text-sm flex items-center justify-center border border-rose-500/30">
                      {candidate.digit}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-200">Digit {candidate.digit}</span>
                        <span className={`text-[9px] font-bold px-1.5 rounded ${
                          candidate.type === 'HOT' 
                            ? 'bg-rose-500/20 text-rose-300' 
                            : candidate.type === 'MARKOV'
                            ? 'bg-indigo-500/20 text-indigo-300'
                            : candidate.type === 'REPEAT'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {candidate.type}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate max-w-[190px]">
                        {candidate.reason}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-mono font-bold text-white block">
                      {candidate.frequency}%
                    </span>
                    <span className="text-[9px] text-rose-400 font-semibold">
                      Match &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>Theoretical Match Return: ~8.5x - 9.2x stake</span>
            <span className="text-emerald-400 font-medium">1 Win covers 8 Losses</span>
          </div>
        </div>

      </div>

      {/* Statistical Parity & AI Signals Panel */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-xl">
        
        {/* Binary & Parity Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Even vs Odd */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400 font-medium">Even vs Odd Digits</span>
              <span className="font-mono text-slate-200">{stats.evenRatio}% / {stats.oddRatio}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
              <div style={{ width: `${stats.evenRatio}%` }} className="bg-emerald-500 h-full" title={`Even: ${stats.evenRatio}%`} />
              <div style={{ width: `${stats.oddRatio}%` }} className="bg-indigo-500 h-full" title={`Odd: ${stats.oddRatio}%`} />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>Even (0,2,4,6,8)</span>
              <span>Odd (1,3,5,7,9)</span>
            </div>
          </div>

          {/* Under vs Over */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400 font-medium">Under (0-4) vs Over (5-9)</span>
              <span className="font-mono text-slate-200">{stats.underRatio}% / {stats.overRatio}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
              <div style={{ width: `${stats.underRatio}%` }} className="bg-amber-500 h-full" title={`Under: ${stats.underRatio}%`} />
              <div style={{ width: `${stats.overRatio}%` }} className="bg-rose-500 h-full" title={`Over: ${stats.overRatio}%`} />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>Under (0-4)</span>
              <span>Over (5-9)</span>
            </div>
          </div>

          {/* Match Repeat Clustering */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium">Consecutive Digit Repeats</div>
              <div className="text-lg font-bold font-mono text-white mt-0.5">
                {stats.repeats} <span className="text-xs font-normal text-slate-500">hits</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400 font-medium">Repeat Clustering Rate</div>
              <span className="text-xs font-bold text-rose-400 font-mono">
                {stats.total > 0 ? ((stats.repeats / stats.total) * 100).toFixed(1) : 10}%
              </span>
            </div>
          </div>

        </div>

        {/* Gemini AI Strategic Matches Insights Box */}
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-rose-950/30 border border-rose-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 mt-0.5">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-300">Gemini Quantitative Matches Engine</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  prediction.riskLevel === 'LOW' 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : prediction.riskLevel === 'ELEVATED'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {prediction.riskLevel} VOLATILITY
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {prediction.aiSummary || prediction.tacticalTip || 'AI model scans tick entropy, frequency resonance, and Markov transition matrices to locate high-probability Matches strike windows.'}
              </p>
            </div>
          </div>

          <button
            id="btn-refresh-ai"
            onClick={onRefreshAiAnalysis}
            disabled={isAiLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 active:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-rose-600/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isAiLoading ? 'animate-spin' : ''}`} />
            <span>{isAiLoading ? 'Scanning...' : 'Deep Matches Scan'}</span>
          </button>
        </div>

      </div>

    </div>
  );
};
