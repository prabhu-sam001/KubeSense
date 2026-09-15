import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export interface SeriesConfig {
  key: string;
  label: string;
  color: string;
}

interface TimeSeriesMultiChartProps {
  data: any[];
  series: SeriesConfig[];
  unit?: string;
  height?: number;
  label?: string;
  timeKey?: string;
}

export function TimeSeriesMultiChart({
  data,
  series,
  unit = '',
  height = 260,
  label,
  timeKey = 'time'
}: TimeSeriesMultiChartProps) {
  // Convert UTC timestamp strings to user's local browser timezone
  const formattedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map(item => {
      let localTime = item[timeKey] || '';
      if (item.timestamp) {
        try {
          const utcStr = item.timestamp.endsWith('Z') ? item.timestamp : item.timestamp + 'Z';
          const d = new Date(utcStr);
          if (!isNaN(d.getTime())) {
            localTime = d.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            });
          }
        } catch {
          // fallback to original timeKey
        }
      }
      return {
        ...item,
        local_time: localTime,
      };
    });
  }, [data, timeKey]);

  if (!formattedData || formattedData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-surface-400 bg-surface-50/50 rounded-xl border border-dashed border-surface-200">
        <p className="text-sm font-medium">Gathering historical telemetry points...</p>
        <span className="text-xs text-surface-400 mt-1">Collecting rolling time-series window</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-surface-500 uppercase tracking-wider">{label}</p>
        </div>
      )}

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={formattedData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
          <defs>
            {series.map(s => (
              <linearGradient key={`grad-${s.key}`} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.22} />
                <stop offset="95%" stopColor={s.color} stopOpacity={0.01} />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          
          <XAxis
            dataKey="local_time"
            tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 500 }}
            axisLine={{ stroke: '#E2E8F0' }}
            tickLine={false}
            minTickGap={25}
          />
          
          <YAxis
            tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            unit={unit}
            width={52}
          />

          <Tooltip
            content={({ active, payload, label: timeLabel }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-surface-200 shadow-xl text-xs space-y-2 min-w-[170px]">
                    <div className="border-b border-surface-100 pb-1.5 flex items-center justify-between">
                      <span className="font-bold text-surface-700">{timeLabel}</span>
                      <span className="text-[10px] text-surface-400 font-medium">Local Time</span>
                    </div>
                    <div className="space-y-1.5">
                      {payload.map((entry: any) => (
                        <div key={entry.dataKey} className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="font-semibold text-surface-600 capitalize">
                              {entry.name || entry.dataKey}
                            </span>
                          </div>
                          <span className="font-bold text-surface-900">
                            {entry.value} {unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />

          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: '8px', fontSize: '11px', fontWeight: 600 }}
          />

          {series.map(s => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2.2}
              fill={`url(#grad-${s.key})`}
              dot={false}
              activeDot={{ r: 4.5, strokeWidth: 1.5, stroke: '#fff', fill: s.color }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
