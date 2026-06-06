import { useState } from 'react';
import { TrendingUp, Coins, Percent, ArrowUpRight, Loader2, Wallet, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface StakeSectionProps {
  walletConnected: boolean;
  ancBalance: number;
}

export default function StakeSection({ walletConnected, ancBalance }: StakeSectionProps) {
  const [stakeAmount, setStakeAmount] = useState('1000');
  const [isStaking, setIsStaking] = useState(false);
  const [stakedBalance, setStakedBalance] = useState(4500);

  const handleStake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletConnected) {
      toast.error('Por favor, conecta tu wallet de Solana para apostar tokens.');
      return;
    }
    const amount = parseFloat(stakeAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Ingresa una cantidad de tokens válida.');
      return;
    }
    if (amount > ancBalance) {
      toast.error('Saldo de tokens ANC insuficiente.');
      return;
    }

    setIsStaking(true);
    try {
      // Simular firma de Solana y staking
      await new Promise((resolve) => setTimeout(resolve, 2500));
      setStakedBalance((prev) => prev + amount);
      toast.success(`¡Apostaste con éxito ${amount.toLocaleString()} ANC!`);
      setStakeAmount('');
    } catch (err) {
      console.error(err);
      toast.error('Ocurrió un error al procesar la transacción.');
    } finally {
      setIsStaking(false);
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-[#030508] p-6 lg:p-10 select-none">
      {/* Encabezado Holográfico */}
      <div className="mb-8 relative">
        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r bg-magma-500 glow-magma-sm" />
        <h1 className="text-xl lg:text-2xl font-bold uppercase tracking-[0.18em] text-white/90 font-sans">
          STAKE & EARN
        </h1>
        <p className="text-[10px] lg:text-xs font-mono tracking-wider text-white/30 mt-1 uppercase">
          Aposta tus tokens ANC y obtén recompensas de rendimiento pasivo respaldadas por las licencias de la red.
        </p>
      </div>

      {/* Tarjetas de Rendimiento Neumórficas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-[rgba(10,15,22,0.4)] border border-white/[0.03] rounded-2xl p-5 shadow-[0_10px_25px_rgba(0,0,0,0.4)] backdrop-blur-xl flex items-center gap-4 relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-20 h-20 rounded-full bg-magma-500/5 blur-[40px]" />
          <div className="w-10 h-10 rounded-xl bg-magma-500/10 border border-magma-500/20 flex items-center justify-center text-magma-400">
            <Percent className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[8px] font-mono tracking-widest text-white/30 uppercase">APY de la Red</p>
            <p className="text-xl font-bold font-mono text-white/90 mt-0.5">18.42%</p>
          </div>
        </div>

        <div className="bg-[rgba(10,15,22,0.4)] border border-white/[0.03] rounded-2xl p-5 shadow-[0_10px_25px_rgba(0,0,0,0.4)] backdrop-blur-xl flex items-center gap-4 relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-20 h-20 rounded-full bg-cyan-500/5 blur-[40px]" />
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[8px] font-mono tracking-widest text-white/30 uppercase">Tokens Apostados</p>
            <p className="text-xl font-bold font-mono text-white/90 mt-0.5">
              {stakedBalance.toLocaleString('en-US')} ANC
            </p>
          </div>
        </div>

        <div className="bg-[rgba(10,15,22,0.4)] border border-white/[0.03] rounded-2xl p-5 shadow-[0_10px_25px_rgba(0,0,0,0.4)] backdrop-blur-xl flex items-center gap-4 relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-20 h-20 rounded-full bg-green-500/5 blur-[40px]" />
          <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[8px] font-mono tracking-widest text-white/30 uppercase">Ganancias Acumuladas</p>
            <p className="text-xl font-bold font-mono text-white/90 mt-0.5">245.80 ANC</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Panel de Staking */}
        <div className="lg:col-span-7 bg-[rgba(10,15,22,0.4)] border border-white/[0.03] rounded-2xl p-6 lg:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-40 h-40 rounded-full bg-magma-500/5 blur-[80px]" />

          <h2 className="text-sm font-bold font-mono tracking-wider text-white/90 uppercase mb-6 flex items-center gap-2">
            <Coins className="w-4 h-4 text-magma-400" />
            Portal de Inversión de Tokens
          </h2>

          <form onSubmit={handleStake} className="space-y-6 relative z-10">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <label className="text-[9px] font-mono font-bold tracking-widest text-magma-400 uppercase">
                  Cantidad a Apostar (ANC)
                </label>
                <span className="text-[9px] font-mono text-white/30 uppercase">
                  Disponible: {ancBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} ANC
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  required
                  disabled={isStaking}
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="Ej. 1000"
                  className="w-full h-12 bg-[#030508]/60 border border-white/[0.06] rounded-xl px-4 pr-16 text-xs font-mono text-white/90 placeholder-white/20 focus:outline-none focus:border-magma-500/40 focus:shadow-[0_0_15px_rgba(255,85,0,0.15)] transition-all duration-300"
                />
                <button
                  type="button"
                  disabled={isStaking}
                  onClick={() => setStakeAmount(Math.floor(ancBalance).toString())}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-6 px-2 rounded bg-magma-500/10 hover:bg-magma-500/20 border border-magma-500/20 text-[9px] font-bold font-mono text-magma-400 transition-colors uppercase"
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Advertencia de Conexión de Wallet */}
            {!walletConnected && (
              <div className="flex items-center gap-3 p-3.5 bg-magma-500/5 border border-magma-500/15 rounded-xl">
                <AlertCircle className="w-4 h-4 text-magma-400 shrink-0" />
                <p className="text-[10px] font-mono text-magma-300/80 leading-relaxed uppercase">
                  Wallet desconectada. Conecta tu wallet para firmar el contrato inteligente de Staking.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isStaking || !walletConnected}
              className="w-full h-12 bg-gradient-to-r from-magma-600 to-magma-500 hover:from-magma-500 hover:to-magma-400 text-black font-extrabold font-mono text-xs tracking-[0.2em] uppercase rounded-xl border border-magma-500/30 shadow-[0_0_20px_rgba(255,85,0,0.3)] hover:shadow-[0_0_30px_rgba(255,85,0,0.5)] active:scale-[0.97] transition-all duration-300 flex items-center justify-center gap-2.5 disabled:opacity-30 disabled:pointer-events-none"
            >
              {isStaking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  APOSTANDO TOKENS...
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-4 h-4" />
                  APOSTAR TOKENS (STAKE)
                </>
              )}
            </button>
          </form>
        </div>

        {/* Panel Informativo */}
        <div className="lg:col-span-5 bg-[rgba(10,15,22,0.4)] border border-white/[0.03] rounded-2xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -left-20 -bottom-20 w-40 h-40 rounded-full bg-cyan-500/5 blur-[80px]" />

          <div>
            <h3 className="text-xs font-bold font-mono tracking-widest text-cyan-400 uppercase mb-4">
              Información de Contrato
            </h3>
            <p className="text-[10px] font-mono text-white/40 leading-relaxed uppercase">
              Al apostar tus tokens ANC en el contrato inteligente de la red, contribuyes a proveer liquidez para la compraventa de licencias de creadores. Recibes un rendimiento pasivo del 18.42% APY, distribuido de forma continua en cada época de Solana (aproximadamente cada 2.5 días).
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-white/[0.04] space-y-3 font-mono text-[10px]">
            <div className="flex justify-between">
              <span className="text-white/20 uppercase">Contrato APY:</span>
              <span className="text-white/80 font-bold">ANC_STK_v4.sol</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/20 uppercase">Período de Bloqueo:</span>
              <span className="text-magma-400 font-bold">Sin Bloqueo (Flexible)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/20 uppercase">Tasa de Distribución:</span>
              <span className="text-cyan-400 font-bold">Por Época</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
