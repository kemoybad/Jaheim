import React, { useState, useEffect } from 'react';
import { 
  X, 
  ExternalLink, 
  Key, 
  CheckCircle2, 
  AlertTriangle, 
  Wallet, 
  RefreshCw, 
  Copy, 
  Check, 
  Lock, 
  LogOut, 
  Eye, 
  EyeOff, 
  User, 
  Mail, 
  Globe, 
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { AccountInfo } from '../types';
import { derivWs } from '../services/derivWs';

interface OAuthSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  allAccounts: AccountInfo[];
  activeAccount: AccountInfo | null;
  onSelectAccount: (account: AccountInfo) => void;
  onEnableSimulator: () => void;
  onAccountsUpdated: (accounts: AccountInfo[]) => void;
  onLogout?: () => void;
}

export const OAuthSyncModal: React.FC<OAuthSyncModalProps> = ({
  isOpen,
  onClose,
  allAccounts,
  activeAccount,
  onSelectAccount,
  onEnableSimulator,
  onAccountsUpdated,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'ACCOUNT' | 'TOKEN' | 'ACCOUNTS'>('TOKEN');
  const [apiToken, setApiToken] = useState<string>('');
  const [showToken, setShowToken] = useState<boolean>(false);
  const [isVerifyingToken, setIsVerifyingToken] = useState<boolean>(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<boolean>(false);

  useEffect(() => {
    // Default to ACCOUNT tab if user is already logged in, otherwise TOKEN
    if (activeAccount) {
      setActiveTab('ACCOUNT');
    } else {
      setActiveTab('TOKEN');
    }
  }, [isOpen, activeAccount?.account]);

  if (!isOpen) return null;

  const handleTokenVerify = async (tokenToUse?: string) => {
    const rawToken = (tokenToUse || apiToken).trim();
    if (!rawToken) {
      setTokenError('Please paste your Deriv API Token');
      return;
    }
    setTokenError(null);
    setIsVerifyingToken(true);

    try {
      const res = await derivWs.authorizeToken(rawToken);
      if (res.error) {
        throw new Error(res.error.message || 'Invalid Deriv API Token');
      }

      const auth = res.authorize;
      const newAccount: AccountInfo = {
        account: auth.loginid,
        token: rawToken,
        currency: auth.currency,
        isVirtual: Boolean(auth.is_virtual),
        balance: auth.balance,
        fullname: auth.fullname,
        country: auth.country,
        scopes: auth.scopes,
        landingCompany: auth.landing_company_name,
      };

      const existing = allAccounts.filter(a => a.account !== newAccount.account);
      const updated = [newAccount, ...existing];
      derivWs.setAccounts(updated);
      onAccountsUpdated(updated);
      onSelectAccount(newAccount);
      setApiToken('');
      setActiveTab('ACCOUNT');
    } catch (err: any) {
      setTokenError(err.message || 'Failed to authenticate token with Deriv');
    } finally {
      setIsVerifyingToken(false);
    }
  };

  const handleCopyToken = (tok: string) => {
    navigator.clipboard.writeText(tok);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleRemoveAccount = (acct: AccountInfo) => {
    const updated = allAccounts.filter(a => a.account !== acct.account);
    derivWs.setAccounts(updated);
    onAccountsUpdated(updated);
    if (activeAccount?.account === acct.account) {
      if (updated.length > 0) {
        derivWs.switchAccount(updated[0]);
        onSelectAccount(updated[0]);
      } else {
        onEnableSimulator();
      }
    }
  };

  const isReal = activeAccount && !activeAccount.isVirtual;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-red-600 flex items-center justify-center shadow-lg shadow-rose-600/30 text-white font-black text-sm">
              <Key className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Deriv API Token & Accounts</h3>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  v3 WS API
                </span>
              </div>
              <p className="text-xs text-slate-400">Direct Personal API Token Authentication & Account Switching</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-950/40 overflow-x-auto">
          {activeAccount && (
            <button
              id="tab-account"
              onClick={() => setActiveTab('ACCOUNT')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'ACCOUNT'
                  ? 'border-rose-500 text-rose-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Active Account</span>
            </button>
          )}

          <button
            id="tab-token"
            onClick={() => setActiveTab('TOKEN')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'TOKEN'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Connect API Key</span>
          </button>

          <button
            id="tab-accounts"
            onClick={() => setActiveTab('ACCOUNTS')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'ACCOUNTS'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Linked Accounts ({allAccounts.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">

          {/* TAB: ACTIVE ACCOUNT */}
          {activeTab === 'ACCOUNT' && activeAccount && (
            <div className="space-y-4">
              
              {/* Active Account Identity Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-4">
                
                <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base ${
                      isReal 
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {isReal ? 'REAL' : 'DEMO'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-lg text-white">{activeAccount.account}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isReal 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {isReal ? 'LIVE' : 'DEMO'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        Active Deriv Trading Account
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[11px] text-slate-400">Available Balance</div>
                    <div className="font-mono text-xl font-extrabold text-emerald-400">
                      ${(activeAccount.balance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      <span className="text-xs ml-1 text-slate-300 font-sans">{activeAccount.currency}</span>
                    </div>
                  </div>
                </div>

                {/* Grid of Verified Account Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/60 flex items-center gap-3">
                    <Wallet className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <div className="overflow-hidden">
                      <div className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Trading Currency</div>
                      <div className="font-medium text-slate-200 truncate">
                        {activeAccount.currency || 'USD'} ({isReal ? 'Live' : 'Virtual Demo'})
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/60 flex items-center gap-3">
                    <User className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <div className="overflow-hidden">
                      <div className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Account Holder</div>
                      <div className="font-medium text-slate-200 truncate">
                        {activeAccount.fullname || 'Deriv Trader'}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/60 flex items-center gap-3">
                    <Globe className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Jurisdiction / Entity</div>
                      <div className="font-medium text-slate-200">
                        {activeAccount.landingCompany || activeAccount.country?.toUpperCase() || 'SVG (St. Vincent)'}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/60 flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Active Permissions</div>
                      <div className="font-medium text-emerald-300 font-mono text-[11px]">
                        {activeAccount.scopes?.join(', ') || 'read, trade'}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Token Row */}
                {activeAccount.token && (
                  <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Key className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span className="text-[11px] text-slate-400 font-semibold whitespace-nowrap">Session Token:</span>
                      <span className="font-mono text-xs text-slate-300 truncate">
                        {showToken ? activeAccount.token : '••••••••••••••••••••••••••••••••'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => setShowToken(!showToken)}
                        title={showToken ? 'Hide token' : 'Show token'}
                        className="p-1 rounded text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleCopyToken(activeAccount.token)}
                        title="Copy token to clipboard"
                        className="p-1 rounded text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

              </div>

              {/* Action Buttons */}
              {onLogout && (
                <div className="flex items-center justify-end pt-2">
                  <button
                    onClick={() => {
                      onLogout();
                      setActiveTab('TOKEN');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Disconnect Account</span>
                  </button>
                </div>
              )}

            </div>
          )}

          {/* TAB: DIRECT API TOKEN LOGIN */}
          {activeTab === 'TOKEN' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-2">
                <div className="flex items-center gap-2 font-bold text-white text-sm">
                  <Key className="w-4 h-4 text-rose-400" />
                  <span>Personal API Key Authentication</span>
                </div>
                <p>
                  Connect directly with your Deriv API Token to authorize trading and load live balances without redirecting.
                </p>
                <a
                  href="https://app.deriv.com/account/api-token"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-rose-400 hover:text-rose-300 font-semibold mt-1"
                >
                  <span>Open Deriv API Token Settings</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Enter Deriv API Token
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                    placeholder="Paste personal token (e.g. pat_...)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-rose-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {tokenError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{tokenError}</span>
                </div>
              )}

              <button
                id="btn-verify-token"
                onClick={() => handleTokenVerify()}
                disabled={isVerifyingToken || !apiToken.trim()}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isVerifyingToken ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Validating API Token with Deriv...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Authorize & Connect Token</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB: LINKED ACCOUNTS */}
          {activeTab === 'ACCOUNTS' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                Switch between your active authorized accounts:
              </div>

              {allAccounts.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl">
                  <Key className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-300">No Deriv accounts logged in yet</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Connect with your saved API Token or paste a token to load all your Real and Demo accounts.
                  </p>
                  <button
                    onClick={() => setActiveTab('TOKEN')}
                    className="mt-4 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Connect API Key
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {allAccounts.map((acct) => {
                    const isActive = activeAccount?.account === acct.account;
                    const acctIsReal = !acct.isVirtual;

                    return (
                      <div
                        key={acct.account}
                        className={`p-4 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                          isActive
                            ? 'bg-rose-950/20 border-rose-500/50 shadow-md shadow-rose-500/5'
                            : 'bg-slate-950/60 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                            acctIsReal ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {acctIsReal ? 'REAL' : 'DEMO'}
                          </span>
                          <div>
                            <div className="font-mono font-bold text-sm text-white flex items-center gap-2">
                              <span>{acct.account}</span>
                              {isActive && (
                                <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {acct.currency} Account • {acctIsReal ? 'Live' : 'Demo'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {!isActive ? (
                            <button
                              onClick={() => {
                                derivWs.switchAccount(acct);
                                onSelectAccount(acct);
                              }}
                              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                            >
                              Switch To
                            </button>
                          ) : (
                            <span className="text-xs font-bold text-rose-400 flex items-center gap-1 mr-1">
                              <CheckCircle2 className="w-4 h-4" /> Connected
                            </span>
                          )}

                          <button
                            onClick={() => handleRemoveAccount(acct)}
                            title="Disconnect Account"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Encrypted WebSocket SSL • Tokens stored securely in browser</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
