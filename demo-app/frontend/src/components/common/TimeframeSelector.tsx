import { Clock } from 'lucide-react';

export type TimeframeOption = '5m' | '15m' | '1h' | '6h' | '24h';

interface TimeframeSelectorProps {
  selected: TimeframeOption;
  onChange: (tf: TimeframeOption) => void;
  className?: string;
  showLivePulse?: boolean;
}

const TIMEFRAMES: { id: TimeframeOption; label: string; desc: string }[] = [
  { id: '5m',  label: '5m',  desc: 'Last 5 minutes (High resolution)' },
  { id: '15m', label: '15m', desc: 'Last 15 minutes' },
  { id: '1h',  label: '1h',  desc: 'Last 1 hour' },
  { id: '6h',  label: '6h',  desc: 'Last 6 hours' },
  { id: '24h', label: '24h', desc: 'Last 24 hours' },
];

export function TimeframeSelector({
  selected,
  onChange,
  className = '',
  showLivePulse = true
}: TimeframeSelectorProps) {
  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-100/80 rounded-xl text-xs font-semibold text-surface-600 border border-surface-200/50">
        <Clock className="h-3.5 w-3.5 text-brand-600" />
        <span className="hidden sm:inline">Timeframe:</span>
      </div>

      <div className="flex items-center gap-1 p-1 bg-surface-100/90 rounded-xl border border-surface-200/60 shadow-inner">
        {TIMEFRAMES.map(({ id, label, desc }) => {
          const isActive = selected === id;
          return (
            <button
              key={id}
              type="button"
              title={desc}
              onClick={() => onChange(id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200
                ${isActive
                  ? 'bg-white text-brand-700 shadow-sm shadow-brand-500/10 border border-brand-200/60 scale-[1.02]'
                  : 'text-surface-500 hover:text-surface-800 hover:bg-white/50'
                }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {showLivePulse && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-xl text-xs font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="hidden md:inline text-[11px] uppercase tracking-wider">Live Sync</span>
        </div>
      )}
    </div>
  );
}
