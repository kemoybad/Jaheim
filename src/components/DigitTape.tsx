import React, { useRef, useEffect } from 'react';
import { ArrowUp, ArrowDown, Zap, Clock } from 'lucide-react';
import { DigitStats, MarketSymbol, TickData } from '../types';

interface DigitTapeProps {
  currentSymbol: MarketSymbol;
  ticks: TickData[];
  stats: DigitStats;
}

export const DigitTape: React.FC<DigitTapeProps> = ({ currentSymbol, ticks, stats }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const latestTick = ticks[ticks.length - 1];
  const prevTick = ticks[ticks.length - 2];

  const isQuoteUp = latestTick && prevTick ? latestTick.quote >= prevTick.quote : true;

  // Auto-scroll the digit tape to the right on each new tick
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: scrollContainerRef.current.scrollWidth,
        behavior: 'smooth',
      });
    }
  }, [ticks.length]);

  const recentTicks = ticks.slice(-30);
  const coldDigit = stats.coldDigits[0];
  const hotDigit = stats.hotDigits[0];

  // Format quote with accurate pip size, splitting out the last digit
  const formatQuoteParts = () => {
    if (!latestTick) return { whole: '0', decimal: '00', lastDigit: '0' };
    const str = latestTick.quote.toFixed(currentSymbol.pipSize);
    const lastChar = str.slice(-1);
    const rest = str.slice(0, -1);
    return {
      rest,
      lastDigit: lastChar,
    };
  };

  const { rest, lastDigit } = formatQuoteParts();

  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 shadow-xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Current Price & Last Digit Display */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl border ${
              isQuoteUp 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              {isQuoteUp ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>{currentSymbol.displayName}</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                  LIVE TICK
                </span>
              </div>
              <div className="flex items-baseline gap-0.5 font-mono">
                <span className="text-2xl font-bold text-white tracking-tight">{rest}</span>
                <span className="text-3xl font-extrabold text-rose-400 bg-rose-500/10 px-1 rounded border border-rose-500/30">
                  {lastDigit}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Streak & Entropy Badge */}
          {stats.streakCount >= 2 && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>
                {stats.streakType === 'repeat' 
                  ? `Digit ${stats.streakDigit} Repeated ${stats.streakCount}x` 
                  : `${stats.streakCount}x ${stats.streakType.toUpperCase()} Streak`}
              </span>
            </div>
          )}
        </div>

        {/* Real-time Digit Tape (Visual Ticker Stream) */}
        <div className="w-full md:flex-1 md:max-w-2xl">
          <div className="flex items-center justify-between mb-1.5 text-[11px] text-slate-400">
            <span className="font-medium flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              Recent Digit Stream ({recentTicks.length} ticks)
            </span>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span> Hot Match
              </span>
              <span className="flex items-center gap-1 text-purple-400">
                <span className="w-2 h-2 rounded-full bg-purple-400"></span> Secondary Match
              </span>
            </div>
          </div>

          <div
            ref={scrollContainerRef}
            className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 bg-slate-950/60 rounded-xl border border-slate-800/60 scrollbar-none"
            style={{ scrollbarWidth: 'none' }}
          >
            {recentTicks.map((tick, index) => {
              const isLast = index === recentTicks.length - 1;
              const isHot = tick.digit === hotDigit;
              const isSecondary = tick.digit === stats.hotDigits[1];
              const isEven = tick.digit % 2 === 0;

              return (
                <div
                  key={`${tick.epoch}_${index}`}
                  className={`relative flex-shrink-0 flex flex-col items-center justify-center w-8 h-10 rounded-lg font-mono text-sm font-bold transition-all ${
                    isLast
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 scale-105 border border-rose-400'
                      : isHot
                      ? 'bg-rose-950/50 text-rose-300 border border-rose-500/40 font-black'
                      : isSecondary
                      ? 'bg-purple-950/40 text-purple-300 border border-purple-500/30'
                      : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span>{tick.digit}</span>
                  <span className={`text-[8px] font-sans font-medium uppercase tracking-tighter ${
                    isEven ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    {isEven ? 'ev' : 'od'}
                  </span>
                  {isLast && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
