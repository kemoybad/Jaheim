export interface AccountInfo {
  account: string;
  token: string;
  currency: string;
  isVirtual: boolean;
  balance?: number;
  email?: string;
  fullname?: string;
  country?: string;
  scopes?: string[];
  landingCompany?: string;
}

export interface MarketSymbol {
  symbol: string;
  displayName: string;
  market: string;
  pipSize: number;
}

export interface TickData {
  epoch: number;
  quote: number;
  digit: number;
  symbol: string;
}

export interface DigitStats {
  counts: Record<number, number>;
  percentages: Record<number, number>;
  total: number;
  coldDigits: number[];
  hotDigits: number[];
  lastDigit: number | null;
  oddRatio: number;
  evenRatio: number;
  underRatio: number; // 0 to 4
  overRatio: number;  // 5 to 9
  repeats: number;
  streakCount: number;
  streakDigit: number | null;
  streakType: 'repeat' | 'even' | 'odd' | 'over' | 'under' | 'none';
}

export interface TradeProposal {
  id: string;
  contractType: 'DIGITMATCH' | 'DIGITDIFF';
  barrier: number;
  askPrice: number;
  payout: number;
  returnPercentage: number;
}

export interface TradeContract {
  id: string;
  contractType: 'DIGITMATCH' | 'DIGITDIFF';
  barrier: number;
  stake: number;
  payout: number;
  profit: number;
  status: 'pending' | 'won' | 'lost';
  entryTick: number;
  exitTick: number | null;
  entryDigit: number | null;
  exitDigit: number | null;
  timestamp: number;
  symbol: string;
  isAuto: boolean;
  account: string;
  isVirtual: boolean;
}

export type AutoStrategy = 
  | 'SNIPER_2000_YIELD'      // 2000% Ultra-Yield Quantum Sniper (Triple Convergence + Compounding)
  | 'HOT_MOMENTUM_MATCH'     // Matches on the hottest / highest frequency digit
  | 'REPEAT_STREAK_MATCH'    // Matches on repeating digits / rapid twin clusters
  | 'MARKOV_SPIKE_MATCH'     // Matches on highest conditional transition P(next|curr)
  | 'COLD_REVERSAL_MATCH'    // Matches on overdue coldest digit mean-reversion breakout
  | 'DYNAMIC_AI_MATCH';      // Dynamically auto-predicts highest resonance Match

export interface AutoTradeConfig {
  enabled: boolean;
  strategy: AutoStrategy;
  baseStake: number;
  currentStake: number;
  autoMatchDigit: boolean; // Auto match & select optimal target digit
  manualTargetDigit: number; // If autoMatchDigit is false
  martingaleMultiplier: number; // e.g. 1.0 (flat), 1.2x, 1.5x for matches (850% payout)
  takeProfit: number;
  stopLoss: number;
  maxConsecutiveLosses: number;
  maxTrades: number;
  intervalTicks: number; // Wait N ticks between trades
  repeatThreshold: number; // For REPEAT_STREAK_MATCH: how many repeats to trigger (e.g. 1 or 2)
  targetYieldPercent?: number; // Target ROI e.g. 2000%
  ultraSniperMode?: boolean; // High-probability triple convergence filter
}

export interface AutoTradeStats {
  totalTrades: number;
  wonTrades: number;
  lostTrades: number;
  consecutiveLosses: number;
  maxConsecutiveLosses: number;
  consecutiveWins: number;
  totalProfit: number;
  sessionRoiPercent: number; // Real-time session ROI percentage (e.g. +2000%)
  status: 'IDLE' | 'RUNNING' | 'STOPPED_TP' | 'STOPPED_SL' | 'STOPPED_MAX_LOSS' | 'STOPPED_MAX_TRADES' | 'PAUSED';
  stopReason?: string;
}

export interface MatchCandidate {
  digit: number;
  frequency: number;
  confidence: number;
  reason: string;
  type: 'HOT' | 'MARKOV' | 'REPEAT' | 'REVERSAL' | 'QUANTUM_2000';
}

export interface PredictionResult {
  recommendedMatch: number;
  matchConfidence: number;
  matchReason: string;
  secondaryMatch?: number;
  secondaryMatchConfidence?: number;
  topMatchCandidates: MatchCandidate[];
  tripleConvergence?: boolean; // True when Hot + Markov + Momentum all point to same digit
  convergenceDigit?: number | null;
  convergenceScore?: number; // 0 - 100%
  projectedYieldPercent?: number; // e.g. 2000%
  recommendedDiffer?: number;
  differConfidence?: number;
  differReason?: string;
  riskLevel: 'LOW' | 'STABLE' | 'ELEVATED';
  aiSummary?: string;
  tacticalTip?: string;
  source: 'algorithmic' | 'gemini';
}
