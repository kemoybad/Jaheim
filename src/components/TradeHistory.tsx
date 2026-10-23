import React, { useState } from 'react';
import { 
  History, 
  ArrowUpRight, 
  ArrowDownRight, 
  Trash2, 
  Download, 
  Filter, 
  Bot, 
  User, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react';
import { TradeContract } from '../types';

interface TradeHistoryProps {
  trades: TradeContract[];
  onClearHistory: () => void;
}

export const TradeHistory: React.FC<TradeHistoryProps> = ({ trades, onClearHistory }) => {
  const [filter, setFilter] = useState<'ALL' | 'WINS' | 'LOSSES' | 'AUTO' | 'MANUAL'>('ALL');

  const filteredTrades = trades.filter((t) => {
    if (filter === 'WINS') return t.status === 'won';
    if (filter === 'LOSSES') return t.status === 'lost';
    if (filter === 'AUTO') return t.isAuto;
    if (filter === 'MANUAL') return !t.isAuto;
    return true;
  });

  const totalWon = trades.filter((t) => t.status === 'won').length;
  const totalLost = trades.filter((t) => t.status === 'lost').length;
  const netPnL = trades.reduce((sum, t) => sum + (t.status === 'won' ? t.profit : -t.stake), 0);

  const exportCSV = () => {
    if (trades.length === 0) return;
    const headers = ['Time', 'Symbol', 'Type', 'Barrier', 'Exit Digit', 'Stake', 'Payout', 'Profit', 'Status', 'Mode', 'Account'];
    const rows = trades.map((t) => [
      new Date(t.timestamp).toISOString(),
      t.symbol,
      t.contractType,
      t.barrier,
      t.exitDigit ?? '',
      t.stake,
      t.payout,
      t.profit,
      t.status,
      t.isAuto ? 'AUTO' : 'MANUAL',
      t.account,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `deriv_trades_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-xl p-5">
      
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-rose-400" />
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Trade Journal & Execution Log</h2>
            <p className="text-[11px] text-slate-400">
              {trades.length} recorded trades | Net P&L: {' '}
              <span className={`font-mono font-bold ${netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {netPnL >= 0 ? '+' : ''}${netPnL.toFixed(2)}
              </span>
            </p>
          </div>
        </div>

        {/* Filter Pills and Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {(['ALL', 'WINS', 'LOSSES', 'AUTO', 'MANUAL'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  filter === f
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <button
            onClick={exportCSV}
            disabled={trades.length === 0}
            title="Export CSV"
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={onClearHistory}
            disabled={trades.length === 0}
            title="Clear History"
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-rose-400 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Trades Table */}
      {filteredTrades.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
          <History className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-400">No trades executed in this view</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Trades from manual clicks or the auto-trader bot will appear here</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="pb-2.5 px-3">Time</th>
                <th className="pb-2.5 px-3">Type</th>
                <th className="pb-2.5 px-3">Symbol</th>
                <th className="pb-2.5 px-3 text-center">Prediction / Exit</th>
                <th className="pb-2.5 px-3 text-right">Stake</th>
                <th className="pb-2.5 px-3 text-right">Payout</th>
                <th className="pb-2.5 px-3 text-right">Net Profit</th>
                <th className="pb-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredTrades.map((trade) => {
                const isWon = trade.status === 'won';
                const isDiff = trade.contractType === 'DIGITDIFF';

                return (
                  <tr key={trade.id} className="hover:bg-slate-800/30 transition-colors">
                    
                    {/* Timestamp & Mode */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-sans">
                        <span className="text-slate-400 text-[11px]">
                          {new Date(trade.timestamp).toLocaleTimeString()}
                        </span>
                        <span className={`text-[9px] font-bold px-1 rounded ${
                          trade.isAuto ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {trade.isAuto ? 'AUTO' : 'MANUAL'}
                        </span>
                      </div>
                    </td>

                    {/* Contract Type */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-sans ${
                        isDiff 
                          ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30' 
                          : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      }`}>
                        {isDiff ? 'DIFFERS' : 'MATCHES'}
                      </span>
                    </td>

                    {/* Symbol */}
                    <td className="py-2.5 px-3 text-slate-300 text-[11px] font-sans whitespace-nowrap">
                      {trade.symbol}
                    </td>

                    {/* Prediction Barrier vs Exit Digit */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span className="text-slate-400">Target: </span>
                      <span className="font-bold text-white px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                        {trade.barrier}
                      </span>
                      <span className="text-slate-600 mx-1.5">➔</span>
                      <span className="text-slate-400">Exit: </span>
                      <span className={`font-bold px-1.5 py-0.5 rounded ${
                        trade.exitDigit !== null
                          ? isWon 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {trade.exitDigit !== null ? trade.exitDigit : '...'}
                      </span>
                    </td>

                    {/* Stake */}
                    <td className="py-2.5 px-3 text-right text-slate-300">
                      ${trade.stake.toFixed(2)}
                    </td>

                    {/* Payout */}
                    <td className="py-2.5 px-3 text-right text-slate-300">
                      ${trade.payout.toFixed(2)}
                    </td>

                    {/* Net Profit */}
                    <td className={`py-2.5 px-3 text-right font-bold ${
                      isWon ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {isWon ? `+$${trade.profit.toFixed(2)}` : `-$${trade.stake.toFixed(2)}`}
                    </td>

                    {/* Status Badge */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap font-sans">
                      {trade.status === 'pending' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                          PENDING
                        </span>
                      ) : isWon ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> WON
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          <XCircle className="w-3 h-3 text-rose-400" /> LOST
                        </span>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};
