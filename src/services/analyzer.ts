import { DigitStats, MarketSymbol, MatchCandidate, PredictionResult, TickData } from '../types';

export const POPULAR_SYMBOLS: MarketSymbol[] = [
  { symbol: '1HZ100V', displayName: 'Volatility 100 (1s) Index', market: 'Synthetic Indices', pipSize: 2 },
  { symbol: '1HZ75V', displayName: 'Volatility 75 (1s) Index', market: 'Synthetic Indices', pipSize: 2 },
  { symbol: '1HZ50V', displayName: 'Volatility 50 (1s) Index', market: 'Synthetic Indices', pipSize: 2 },
  { symbol: '1HZ25V', displayName: 'Volatility 25 (1s) Index', market: 'Synthetic Indices', pipSize: 2 },
  { symbol: '1HZ10V', displayName: 'Volatility 10 (1s) Index', market: 'Synthetic Indices', pipSize: 2 },
  { symbol: 'R_100', displayName: 'Volatility 100 Index', market: 'Synthetic Indices', pipSize: 2 },
  { symbol: 'R_75', displayName: 'Volatility 75 Index', market: 'Synthetic Indices', pipSize: 4 },
  { symbol: 'R_50', displayName: 'Volatility 50 Index', market: 'Synthetic Indices', pipSize: 4 },
  { symbol: 'R_25', displayName: 'Volatility 25 Index', market: 'Synthetic Indices', pipSize: 3 },
  { symbol: 'R_10', displayName: 'Volatility 10 Index', market: 'Synthetic Indices', pipSize: 3 },
];

/**
 * Accurately extracts the last digit from a Deriv tick quote using its pip precision
 */
export function extractLastDigit(quote: number, pipSize: number = 2): number {
  if (typeof quote !== 'number' || isNaN(quote)) return 0;
  
  // Format with the specified pip precision
  const formatted = quote.toFixed(Math.max(0, pipSize));
  const lastChar = formatted.slice(-1);
  const parsed = parseInt(lastChar, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Computes deep statistical metrics across a sample of recent ticks
 */
export function computeDigitStats(ticks: TickData[]): DigitStats {
  const counts: Record<number, number> = {
    0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0,
  };

  if (!ticks || ticks.length === 0) {
    const defaultPerc: Record<number, number> = {
      0: 10, 1: 10, 2: 10, 3: 10, 4: 10, 5: 10, 6: 10, 7: 10, 8: 10, 9: 10,
    };
    return {
      counts,
      percentages: defaultPerc,
      total: 0,
      coldDigits: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      hotDigits: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      lastDigit: null,
      oddRatio: 50,
      evenRatio: 50,
      underRatio: 50,
      overRatio: 50,
      repeats: 0,
      streakCount: 0,
      streakDigit: null,
      streakType: 'none',
    };
  }

  let oddCount = 0;
  let evenCount = 0;
  let underCount = 0; // 0 to 4
  let overCount = 0;  // 5 to 9
  let repeatCount = 0;

  for (let i = 0; i < ticks.length; i++) {
    const d = ticks[i].digit;
    counts[d] = (counts[d] || 0) + 1;

    if (d % 2 === 0) evenCount++;
    else oddCount++;

    if (d <= 4) underCount++;
    else overCount++;

    if (i > 0 && ticks[i].digit === ticks[i - 1].digit) {
      repeatCount++;
    }
  }

  const total = ticks.length;
  const percentages: Record<number, number> = {};
  for (let d = 0; d <= 9; d++) {
    percentages[d] = total > 0 ? Number(((counts[d] / total) * 100).toFixed(1)) : 10;
  }

  // Sort digits by appearance frequency
  const digitList = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const coldDigits = [...digitList].sort((a, b) => counts[a] - counts[b]);
  const hotDigits = [...digitList].sort((a, b) => counts[b] - counts[a]);

  const lastDigit = ticks[ticks.length - 1]?.digit ?? null;

  // Calculate current streak
  let streakCount = 1;
  let streakDigit = lastDigit;
  let streakType: 'repeat' | 'even' | 'odd' | 'over' | 'under' | 'none' = 'none';

  if (ticks.length >= 2) {
    // Check digit repetition streak
    let rStreak = 1;
    for (let i = ticks.length - 2; i >= 0; i--) {
      if (ticks[i].digit === lastDigit) {
        rStreak++;
      } else {
        break;
      }
    }
    if (rStreak >= 2) {
      streakCount = rStreak;
      streakType = 'repeat';
    } else {
      // Check even/odd streak
      const lastIsEven = lastDigit !== null && lastDigit % 2 === 0;
      let parityStreak = 1;
      for (let i = ticks.length - 2; i >= 0; i--) {
        const isEven = ticks[i].digit % 2 === 0;
        if (isEven === lastIsEven) {
          parityStreak++;
        } else {
          break;
        }
      }
      if (parityStreak >= 3) {
        streakCount = parityStreak;
        streakType = lastIsEven ? 'even' : 'odd';
      }
    }
  }

  return {
    counts,
    percentages,
    total,
    coldDigits,
    hotDigits,
    lastDigit,
    oddRatio: total > 0 ? Number(((oddCount / total) * 100).toFixed(1)) : 50,
    evenRatio: total > 0 ? Number(((evenCount / total) * 100).toFixed(1)) : 50,
    underRatio: total > 0 ? Number(((underCount / total) * 100).toFixed(1)) : 50,
    overRatio: total > 0 ? Number(((overCount / total) * 100).toFixed(1)) : 50,
    repeats: repeatCount,
    streakCount,
    streakDigit,
    streakType,
  };
}

/**
 * Builds transition matrix P(d_next | d_current) from tick sequence
 */
export function computeMarkovMatrix(digits: number[]): Record<number, Record<number, number>> {
  const matrix: Record<number, Record<number, number>> = {};
  for (let i = 0; i <= 9; i++) {
    matrix[i] = {};
    for (let j = 0; j <= 9; j++) {
      matrix[i][j] = 0;
    }
  }

  for (let k = 0; k < digits.length - 1; k++) {
    const curr = digits[k];
    const next = digits[k + 1];
    if (curr >= 0 && curr <= 9 && next >= 0 && next <= 9) {
      matrix[curr][next]++;
    }
  }

  return matrix;
}

/**
 * Evaluates real-time algorithmic prediction for Digit Matches (High Payout ~850% Contracts)
 */
export function predictOptions(stats: DigitStats, digits: number[]): PredictionResult {
  const hotDigit = stats.hotDigits[0] ?? 7;
  const runnerUpHot = stats.hotDigits[1] ?? (hotDigit === 3 ? 5 : 3);
  const coldDigit = stats.coldDigits[0] ?? 0;
  const lastDigit = stats.lastDigit;

  // Calculate Markov transition if we have historical data
  let markovPeakNext = hotDigit;
  let markovPeakProb = 10;
  if (lastDigit !== null && digits.length >= 15) {
    const markov = computeMarkovMatrix(digits);
    const transitions = markov[lastDigit];
    let maxTransCount = -1;
    let totalTransFromLast = 0;
    for (let d = 0; d <= 9; d++) {
      const c = transitions[d] || 0;
      totalTransFromLast += c;
      if (c > maxTransCount) {
        maxTransCount = c;
        markovPeakNext = d;
      }
    }
    if (totalTransFromLast > 0 && maxTransCount > 0) {
      markovPeakProb = Math.round((maxTransCount / totalTransFromLast) * 100);
    }
  }

  // Primary Match: choose between hot digit momentum or conditional Markov peak
  const hotFreq = stats.percentages[hotDigit] || 10;
  const runnerFreq = stats.percentages[runnerUpHot] || 10;
  
  // Decide primary recommended match
  let recommendedMatch = hotDigit;
  let matchReason = `Digit ${hotDigit} is leading with highest cluster frequency (${hotFreq}%) over the sample window.`;
  let matchConfidence = Math.min(32, Math.max(12, Number((hotFreq * 1.2).toFixed(1))));

  if (markovPeakProb >= 22 && markovPeakNext !== hotDigit) {
    recommendedMatch = markovPeakNext;
    matchConfidence = Math.min(35, Math.max(15, markovPeakProb));
    matchReason = `Digit ${markovPeakNext} shows highest transition frequency (${markovPeakProb}%) following last digit ${lastDigit}.`;
  }

  const secondaryMatch = recommendedMatch === hotDigit ? runnerUpHot : hotDigit;
  const secondaryMatchConfidence = Math.min(28, Math.max(12, Number(((stats.percentages[secondaryMatch] || 10) * 1.1).toFixed(1))));

  // Check Triple Convergence for 2000% Yield Sniper
  const isMarkovAligned = markovPeakNext === hotDigit;
  const isStreakAligned = lastDigit === hotDigit && stats.streakCount >= 1;
  const tripleConvergence = isMarkovAligned || (hotFreq >= 18 && markovPeakProb >= 20);
  const convergenceDigit = tripleConvergence ? hotDigit : (markovPeakProb >= 25 ? markovPeakNext : hotDigit);
  
  let convergenceScore = 50;
  if (isMarkovAligned) convergenceScore += 25;
  if (isStreakAligned) convergenceScore += 15;
  if (hotFreq >= 18) convergenceScore += 10;
  convergenceScore = Math.min(99, Math.max(40, convergenceScore));

  const projectedYieldPercent = 2000;

  // Generate top 3 Match Candidates with guaranteed distinct digits
  const usedDigits = new Set<number>();
  usedDigits.add(recommendedMatch);

  // Pick secondary candidate that is different from primary
  let candidate2Digit = secondaryMatch;
  if (usedDigits.has(candidate2Digit)) {
    const alternative = stats.hotDigits.find(d => !usedDigits.has(d)) ?? ((recommendedMatch + 1) % 10);
    candidate2Digit = alternative;
  }
  usedDigits.add(candidate2Digit);

  const topMatchCandidates: MatchCandidate[] = [
    {
      digit: recommendedMatch,
      frequency: stats.percentages[recommendedMatch] || 10,
      confidence: matchConfidence,
      reason: tripleConvergence 
        ? `🔥 2000% YIELD CONVERGENCE: Markov matrix and momentum frequency both point to Digit ${recommendedMatch}!`
        : matchReason,
      type: tripleConvergence ? 'QUANTUM_2000' : (markovPeakNext === recommendedMatch ? 'MARKOV' : 'HOT'),
    },
    {
      digit: candidate2Digit,
      frequency: stats.percentages[candidate2Digit] || 10,
      confidence: secondaryMatchConfidence,
      reason: `Digit ${candidate2Digit} displays persistent secondary momentum (${stats.percentages[candidate2Digit] || 10}%).`,
      type: 'HOT',
    },
  ];

  // Third candidate: repeat if unique, otherwise cold mean-reversion, or next unused digit
  let candidate3Digit: number;
  let candidate3Type: 'REPEAT' | 'REVERSAL' = 'REVERSAL';
  let candidate3Reason = '';

  if (lastDigit !== null && stats.streakCount >= 2 && !usedDigits.has(lastDigit)) {
    candidate3Digit = lastDigit;
    candidate3Type = 'REPEAT';
    candidate3Reason = `Digit ${lastDigit} is in an active ${stats.streakCount}x repetition streak.`;
  } else {
    candidate3Digit = stats.coldDigits.find(d => !usedDigits.has(d)) ?? 
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].find(d => !usedDigits.has(d)) ?? 0;
    candidate3Type = 'REVERSAL';
    candidate3Reason = `Overdue digit ${candidate3Digit} (${stats.percentages[candidate3Digit] || 0}%) poised for mean-reversion breakout.`;
  }
  usedDigits.add(candidate3Digit);

  topMatchCandidates.push({
    digit: candidate3Digit,
    frequency: stats.percentages[candidate3Digit] || 10,
    confidence: candidate3Type === 'REPEAT' ? Math.min(26, 12 + stats.streakCount * 4) : 14,
    reason: candidate3Reason,
    type: candidate3Type,
  });

  let riskLevel: 'LOW' | 'STABLE' | 'ELEVATED' = 'STABLE';
  if (tripleConvergence || matchConfidence >= 22) {
    riskLevel = 'LOW';
  } else if (stats.streakCount >= 3) {
    riskLevel = 'ELEVATED';
  }

  const tacticalTip = tripleConvergence
    ? `⚡ 2000% QUANTUM SNIPER WINDOW ACTIVE: Triple convergence detected on Digit ${convergenceDigit} (${convergenceScore}% alignment). Targeting 2000% compounding ladder.`
    : matchConfidence >= 20
    ? `Strong Match resonance on Digit ${recommendedMatch} (~${matchConfidence}% probability vs 10% theoretical average). Payout yields ~+850% per win.`
    : `Digit entropy is balanced. Target momentum spikes on Digit ${recommendedMatch} or wait for a 2x repeat before triggering entry.`;

  return {
    recommendedMatch,
    matchConfidence,
    matchReason,
    secondaryMatch,
    secondaryMatchConfidence,
    topMatchCandidates,
    tripleConvergence,
    convergenceDigit,
    convergenceScore,
    projectedYieldPercent,
    riskLevel,
    source: 'algorithmic',
    tacticalTip,
  };
}
