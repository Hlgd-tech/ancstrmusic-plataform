import { useState } from 'react';
import { X, Copy, ExternalLink, TrendingUp, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WalletState } from '../types';

interface WalletWidgetProps {
  wallet: WalletState;
  onConnect: (provider: 'phantom' | 'solflare') => void;
  onDisconnect: () => void;
  onClose: () => void;
}

const PROVIDERS = [
  { id: 'phantom' as const, name: 'Phantom', color: '#AB9FF2', dot: '#6C5DD3' },
  { id: 'solflare' as const, name: 'Solflare', color: '#FFA726', dot: '#FF6D00' },
];

export default function WalletWidget({ wallet, onConnect, onDisconnect, onClose }: WalletWidgetProps) {
  const [copied, setCopied] = useState(false);
  const [stakeExpanded, setStakeExpanded] = useState(false);

  const handleCopy = () => {
    if (wallet.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      className="glass-panel rounded-2xl border-cyan-glow glow-cyan-sm w-72 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
        <p className="text-[9px] uppercase tracking-[0.2em] text-cyan-300/50 font-medium">
          {wallet.connected ? '/ Wallet' : '/ Connect Wallet'}
        </p>
        <button onClick={onClose} className="text-white/20 hover:text-white/50 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {!wallet.connected ? (
        /* Not connected */
        <div className="p-5 space-y-3">
          <p className="text-xs text-white/30 leading-relaxed">
            Connect your Solana wallet to stream, tip artists, and earn rewards.
          </p>
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => onConnect(p.id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.06] transition-all active:scale-98 group"
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: p.dot, boxShadow: `0 0 8px ${p.dot}60` }}
              />
              <span className="text-sm font-medium text-white/60 group-hover:text-white/90 transition-colors">
                {p.name}
              </span>
              <span className="ml-auto text-white/20 text-xs">→</span>
            </button>
          ))}
        </div>
      ) : (
        /* Connected */
        <div className="p-5 space-y-4">
          {/* Address */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-cyan-950/30 border border-cyan-300/10">
            <span
              className="w-2 h-2 rounded-full bg-cyan-300 animate-live-pulse shrink-0"
              style={{ boxShadow: '0 0 6px rgba(0, 240, 255, 0.6)' }}
            />
            <span className="font-mono-num text-xs text-cyan-300/80 flex-1 truncate">
              {wallet.address}
            </span>
            <button onClick={handleCopy} className="text-white/20 hover:text-cyan-300/60 transition-colors shrink-0">
              <Copy className="w-3.5 h-3.5" />
            </button>
            {copied && (
              <span className="absolute text-[9px] text-cyan-300 bg-void-950 px-1.5 py-0.5 rounded">Copied!</span>
            )}
          </div>

          {/* ANC Balance highlight */}
          {wallet.ancBalance > 0 && (
            <div className="p-3 rounded-xl bg-magma-600/[0.06] border border-magma-600/15">
              <p className="text-[8px] uppercase tracking-[0.2em] text-magma-400/50 mb-1">ANC Balance</p>
              <p className="font-mono-num text-base font-bold text-magma-400">
                {wallet.ancBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="font-mono-num text-[10px] text-white/25">
                ≈ ${wallet.ancUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
              </p>
            </div>
          )}

          {/* Balances */}
          <div className="space-y-2">
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/20">Balances</p>
            {[
              { token: 'SOL', amount: wallet.balances.SOL, color: 'text-cyan-300', decimals: 3 },
              { token: 'USDC', amount: wallet.balances.USDC, color: 'text-magma-300', decimals: 2 },
              { token: 'USDT', amount: wallet.balances.USDT, color: 'text-magma-200', decimals: 2 },
            ].map(({ token, amount, color, decimals }) => (
              <div key={token} className="flex items-center justify-between py-2 border-b border-white/[0.03] last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono font-semibold ${color} tracking-wider`}>{token}</span>
                </div>
                <span className={`font-mono-num text-sm font-semibold ${color}`}>
                  {amount.toFixed(decimals)}
                </span>
              </div>
            ))}
          </div>

          {/* Stake & Earn */}
          <div className="rounded-xl border border-magma-600/20 bg-magma-600/[0.04] overflow-hidden">
            <button
              onClick={() => setStakeExpanded(!stakeExpanded)}
              className="w-full flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-magma-400" />
                <span className="text-xs font-semibold text-magma-300">Stake & Earn</span>
              </div>
              {stakeExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-magma-400/60" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-magma-400/60" />
              )}
            </button>

            <AnimatePresence>
              {stakeExpanded && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/30">APY</span>
                      <span className="font-mono-num text-magma-300 font-semibold">18.4%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/30">Staked</span>
                      <span className="font-mono-num text-white/60">0.00 USDC</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Amount"
                        className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white/70 placeholder-white/15 outline-none focus:border-magma-600/30 font-mono-num"
                      />
                      <button className="px-3 py-2 rounded-lg text-[10px] font-semibold text-white bg-magma-600/80 hover:bg-magma-600 glow-magma-sm transition-all active:scale-95">
                        Stake
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick tip */}
          <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-cyan-300/[0.06] border border-cyan-300/15 text-xs font-semibold text-cyan-300/80 hover:bg-cyan-300/10 hover:text-cyan-300 transition-all glow-cyan-sm active:scale-98">
            <Zap className="w-3.5 h-3.5" />
            Quick Tip Artist
          </button>

          {/* Disconnect */}
          <button
            onClick={onDisconnect}
            className="w-full flex items-center justify-center gap-2 py-2 text-[10px] text-white/15 hover:text-white/35 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Disconnect
          </button>
        </div>
      )}
    </motion.div>
  );
}
