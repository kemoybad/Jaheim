import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

function getAlgorithmicFallback(symbol: string, frequency: any, stats: any) {
  const hotDigits = Object.entries(frequency || {})
    .sort((a: any, b: any) => (b[1] as number) - (a[1] as number))
    .slice(0, 3)
    .map(([digit]) => Number(digit));

  const hotDigit = hotDigits[0] ?? 7;
  const runnerUp = hotDigits[1] ?? 3;
  const hotFreq = frequency?.[hotDigit] || 0;
  const runnerFreq = frequency?.[runnerUp] || 0;

  return {
    source: 'algorithmic',
    summary: `Quantitative analysis on ${symbol || 'Volatility Index'}: Digit ${hotDigit} displays peak cluster momentum (${hotFreq}%). Runner-up digit ${runnerUp} (${runnerFreq}%).`,
    matchRecommendation: {
      digit: hotDigit,
      confidence: Math.min(32, Math.max(12, 10 + Math.round(hotFreq * 1.1))),
      reason: `Digit ${hotDigit} displays short-term momentum clustering with elevated re-hit probability for ~850% payout.`,
    },
    topMatchCandidates: [
      { digit: hotDigit, frequency: hotFreq, confidence: 24, reason: 'Peak momentum cluster', type: 'HOT' },
      { digit: runnerUp, frequency: runnerFreq, confidence: 18, reason: 'Secondary frequency runner-up', type: 'HOT' },
    ],
    riskLevel: (stats?.currentStreak || 0) > 2 ? 'ELEVATED' : 'STABLE',
    tacticalTip: 'Matches contracts yield ~850% net return. Target hot momentum clusters or twin digit repeats for optimal risk/reward.',
  };
}

// Configuration endpoint
app.get('/api/config', (req, res) => {
  const appId = process.env.DERIV_APP_ID || '1089';
  const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  res.json({
    appId,
    appUrl,
    hasGemini: Boolean(process.env.GEMINI_API_KEY),
  });
});

// OAuth authorization URL helper endpoint
app.get('/api/auth/url', (req, res) => {
  const appId = req.query.app_id ? String(req.query.app_id) : (process.env.DERIV_APP_ID || '1089');
  const redirectUri = req.query.redirect_uri
    ? String(req.query.redirect_uri)
    : `${process.env.APP_URL || `${req.protocol}://${req.get('host')}`}/auth/callback`;

  // Deriv OAuth 2.0 authorization URL
  // Supported brand parameter is 'deriv'
  const derivAuthUrl = `https://oauth.deriv.com/oauth2/authorize?app_id=${encodeURIComponent(appId)}&l=en&brand=deriv&redirect_uri=${encodeURIComponent(redirectUri)}`;

  res.json({
    url: derivAuthUrl,
    appId,
    redirectUri,
  });
});

// OAuth Callback Route (popup landing page conforming to AI Studio OAuth guidelines)
const oauthCallbackHandler: express.RequestHandler = (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Deriv Authentication</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #090d16;
      color: #f1f5f9;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      text-align: center;
      padding: 24px;
    }
    .card {
      background: #131b2e;
      border: 1px solid #1e293b;
      padding: 32px;
      border-radius: 16px;
      max-width: 420px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .spinner {
      width: 44px;
      height: 44px;
      border: 3px solid rgba(244, 63, 94, 0.2);
      border-top-color: #f43f5e;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h2 { margin: 0 0 8px; font-size: 20px; color: #fff; }
    p { margin: 0; color: #94a3b8; font-size: 14px; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <h2>Connecting to Deriv...</h2>
    <p id="status-msg">Synchronizing account tokens with your Deriv analysis workspace...</p>
  </div>
  <script>
    (function() {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const accounts = [];
        
        // Deriv OAuth returns acct1, token1, cur1, acct2, token2, cur2...
        let idx = 1;
        while (urlParams.has('acct' + idx)) {
          const acct = urlParams.get('acct' + idx);
          const token = urlParams.get('token' + idx);
          const cur = urlParams.get('cur' + idx) || 'USD';
          if (acct && token) {
            accounts.push({
              account: acct,
              token: token,
              currency: cur,
              isVirtual: acct.toUpperCase().startsWith('VRTC'),
            });
          }
          idx++;
        }

        // Also capture generic code or token if provided
        const code = urlParams.get('code');
        const token = urlParams.get('token');

        const payload = {
          type: 'DERIV_OAUTH_SUCCESS',
          accounts: accounts,
          code: code,
          token: token,
          rawQuery: window.location.search
        };

        if (window.opener) {
          window.opener.postMessage(payload, '*');
          document.getElementById('status-msg').innerText = 'Connected! Closing window...';
          setTimeout(function() {
            window.close();
          }, 800);
        } else {
          // If not in a popup, store in localStorage and redirect back
          if (accounts.length > 0) {
            localStorage.setItem('deriv_oauth_accounts', JSON.stringify(accounts));
          }
          document.getElementById('status-msg').innerHTML = 'Authentication completed. <a href="/" style="color:#f43f5e">Click here to return to the app</a>';
          setTimeout(function() {
            window.location.href = '/';
          }, 1200);
        }
      } catch (err) {
        console.error('Error in OAuth callback:', err);
        document.getElementById('status-msg').innerText = 'Error processing callback: ' + err.message;
      }
    })();
  </script>
</body>
</html>`);
};

app.get('/oauth/callback', oauthCallbackHandler);
app.get('/oauth/callback/', oauthCallbackHandler);

// AI Pattern & Risk Analysis Endpoint (Gemini 3.8 Flash)
app.post('/api/ai/analyze', async (req, res) => {
  const { symbol, recentDigits, frequency, stats } = req.body || {};

  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.json(getAlgorithmicFallback(symbol, frequency, stats));
    }

    const prompt = `You are a quantitative algorithmic trading assistant for Deriv synthetic indices digit trading specializing exclusively in Digit Matches contracts (which offer high ~850% net payouts).
Analyze the following real-time digit tick sample:
- Symbol: ${symbol || 'Volatility 100 (1s) Index'}
- Last 30 Digits (most recent last): ${JSON.stringify(recentDigits?.slice(-30) || [])}
- Digit Distribution (0 to 9 counts/percentages): ${JSON.stringify(frequency || {})}
- Current Streak: ${stats?.currentStreak || 0} consecutive ${stats?.streakType || 'random'}
- Odd/Even Ratio: ${stats?.oddRatio || 50}% / ${stats?.evenRatio || 50}%
- Over/Under (0-4 vs 5-9): ${stats?.underRatio || 50}% / ${stats?.overRatio || 50}%

Provide a concise, quantitative assessment for DIGIT MATCHES in JSON format:
{
  "summary": "1-2 sentence executive assessment of digit entropy, clustering, and high-probability strike windows",
  "matchRecommendation": {
    "digit": number (0-9, the highest probability digit for MATCHES),
    "confidence": number (12-35, estimated match probability given clustering or Markov transition),
    "reason": "short explanation for why this digit has the highest match momentum or transition spike"
  },
  "topMatchCandidates": [
    { "digit": 7, "frequency": 18, "confidence": 24, "reason": "Leading cluster", "type": "HOT" }
  ],
  "riskLevel": "LOW" | "STABLE" | "ELEVATED",
  "tacticalTip": "One crisp tactical execution advice for Matches contracts (e.g. flat staking vs progression, repeat entry, or cooldown)"
}
Return ONLY valid JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim() || '{}';
    const parsed = JSON.parse(text);
    return res.json({ source: 'gemini', ...parsed });
  } catch (error: any) {
    console.warn('AI Analysis fallback triggered:', error?.message || error);
    return res.json(getAlgorithmicFallback(symbol, frequency, stats));
  }
});

// Setup Vite development middleware or static production serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Deriv Analysis & Trading Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
