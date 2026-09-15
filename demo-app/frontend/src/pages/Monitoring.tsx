import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, HardDrive, Wifi, History } from 'lucide-react';
import { TimeframeSelector, type TimeframeOption } from '../components/common/TimeframeSelector';
import { TimeSeriesMultiChart } from '../components/charts/TimeSeriesMultiChart';
import { apiService } from '../services/api';
import type { Telemetry } from '../types';

const TABS = [
  { id: 'cpu',     label: 'CPU & Memory', icon: Cpu },
  { id: 'storage', label: 'Storage',      icon: HardDrive },
  { id: 'network', label: 'Network',      icon: Wifi },
];

interface MonitoringProps { telemetry: Telemetry; }

export function Monitoring({ telemetry }: MonitoringProps) {
  const [tab, setTab] = useState('cpu');
  const [timeframe, setTimeframe] = useState<TimeframeOption>('15m');
  const [historyData, setHistoryData] = useState<any[]>([]);

  const { metrics, pvc_metrics, net_metrics } = telemetry;
  const pods = Object.entries(metrics);

  // Fetch historical time series based on selected timeframe
  useEffect(() => {
    let isMounted = true;

    const fetchHistory = async () => {
      try {
        const res = await apiService.getMetricsHistory(timeframe);
        if (isMounted && res?.data && res.data.length > 0) {
          setHistoryData(res.data);
        }
      } catch (err) {
        console.warn('Failed to fetch historical telemetry for monitoring:', err);
      }
    };

    fetchHistory();
    const interval = setInterval(fetchHistory, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [timeframe]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="page-header-title">Monitoring</h2>
          <p className="page-header-subtitle">Deep-dive resource metrics and historical telemetry across all services</p>
        </div>

        {/* Global Timeframe Selector */}
        <TimeframeSelector selected={timeframe} onChange={setTimeframe} />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-surface-100/70 rounded-2xl w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-600 transition-all
              ${tab === id ? 'bg-white text-brand-700 shadow-card' : 'text-surface-500 hover:text-surface-700'}`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>

          {/* CPU & Memory Tab */}
          {tab === 'cpu' && (
            <div className="space-y-6">
              {/* Pod Snapshot Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {pods.map(([pod, m]) => (
                  <div key={pod} className="solid-card p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-600 text-surface-500 uppercase tracking-wider truncate">{pod.split('-')[0]}</span>
                      <Cpu className="h-4 w-4 text-brand-400" />
                    </div>
                    <p className="metric-value text-xl">{Math.round((m.cpu_cores || 0) * 1000)}m</p>
                    <p className="text-xs text-surface-400 mt-1 font-500">{m.cpu_cores?.toFixed(4)} cores · {m.memory_mb?.toFixed(0)}Mi RAM</p>
                    <div className="mt-3 h-1.5 bg-surface-100 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(2, (m.cpu_cores || 0) * 100))}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Historical CPU Time-Series Chart */}
              <div className="solid-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-700 text-surface-800">Historical CPU Load (millicores)</h3>
                  <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg">
                    Timeline: {timeframe}
                  </span>
                </div>
                <p className="text-xs text-surface-400 mb-4">Continuous millicores consumption over time with exact timestamps</p>
                <TimeSeriesMultiChart
                  data={historyData}
                  series={[
                    { key: 'frontend_cpu', label: 'Frontend CPU (m)', color: '#0D9488' },
                    { key: 'backend_cpu', label: 'Backend CPU (m)', color: '#7C3AED' },
                    { key: 'database_cpu', label: 'Database CPU (m)', color: '#06B6D4' },
                  ]}
                  unit="m"
                  height={260}
                />
              </div>

              {/* Historical Memory Time-Series Chart */}
              <div className="solid-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-700 text-surface-800">Historical Memory Consumption (MiB)</h3>
                  <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg">
                    Timeline: {timeframe}
                  </span>
                </div>
                <p className="text-xs text-surface-400 mb-4">RAM working set allocation per microservice with timestamps</p>
                <TimeSeriesMultiChart
                  data={historyData}
                  series={[
                    { key: 'frontend_mem', label: 'Frontend RAM (MiB)', color: '#0D9488' },
                    { key: 'backend_mem', label: 'Backend RAM (MiB)', color: '#7C3AED' },
                    { key: 'database_mem', label: 'Database RAM (MiB)', color: '#06B6D4' },
                  ]}
                  unit="Mi"
                  height={260}
                />
              </div>
            </div>
          )}

          {/* Storage Tab */}
          {tab === 'storage' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pvc_metrics.length === 0 ? (
                  <div className="col-span-3 flex justify-center items-center h-40 text-surface-300">No PVC data available</div>
                ) : pvc_metrics.map(pvc => {
                  const pct = pvc.percentage_used;
                  const color = pct > 85 ? 'bg-danger-500' : pct > 65 ? 'bg-warning-500' : 'bg-success-500';
                  const textColor = pct > 85 ? 'text-danger-600' : pct > 65 ? 'text-warning-600' : 'text-success-600';
                  return (
                    <div key={pvc.pvc_name} className="solid-card p-6">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-700 text-surface-800 truncate">{pvc.pvc_name}</p>
                        <HardDrive className="h-4 w-4 text-surface-300" />
                      </div>
                      <p className={`text-3xl font-700 tracking-tight mb-1 ${textColor}`}>{pct.toFixed(1)}%</p>
                      <p className="text-xs text-surface-400 mb-3">{pvc.used_mb?.toFixed(0)} MB / {pvc.capacity_mb?.toFixed(0)} MB</p>
                      <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Historical Storage Time-Series Chart */}
              <div className="solid-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-700 text-surface-800">Persistent Volume Storage Saturation Curve</h3>
                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg">
                    Timeline: {timeframe}
                  </span>
                </div>
                <p className="text-xs text-surface-400 mb-4">PVC disk utilization percentage over time with timestamps</p>
                <TimeSeriesMultiChart
                  data={historyData}
                  series={[
                    { key: 'storage_pct', label: 'Database PVC Utilization (%)', color: '#F59E0B' }
                  ]}
                  unit="%"
                  height={260}
                />
              </div>
            </div>
          )}

          {/* Network Tab */}
          {tab === 'network' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Active Links', value: net_metrics.length, sub: 'service connections', color: 'text-brand-600' },
                  { label: 'Avg Latency',  value: net_metrics.length ? (net_metrics.reduce((s, l) => s + l.latency_ms, 0) / net_metrics.length).toFixed(0) + 'ms' : '—', sub: 'across all links', color: 'text-surface-900' },
                  { label: 'Total Conns',  value: net_metrics.reduce((s, l) => s + l.tcp_connections, 0), sub: 'TCP connections', color: 'text-surface-900' },
                ].map(c => (
                  <div key={c.label} className="solid-card p-5">
                    <p className="metric-label mb-2">{c.label}</p>
                    <p className={`text-3xl font-700 tracking-tight ${c.color}`}>{c.value}</p>
                    <p className="text-xs text-surface-400 mt-1">{c.sub}</p>
                  </div>
                ))}
              </div>

              {/* Historical Network Latency & Packet Drop Chart */}
              <div className="solid-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-700 text-surface-800">Inter-Service Latency Timeline</h3>
                  <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg">
                    Timeline: {timeframe}
                  </span>
                </div>
                <p className="text-xs text-surface-400 mb-4">Round-trip RPC latency (ms) and packet drop rate with timestamps</p>
                <TimeSeriesMultiChart
                  data={historyData}
                  series={[
                    { key: 'latency_ms', label: 'P95 RPC Latency (ms)', color: '#E11D48' },
                    { key: 'packet_loss_pct', label: 'Packet Drop Rate (%)', color: '#6366F1' },
                  ]}
                  height={260}
                />
              </div>

              {/* Network Table */}
              <div className="solid-card p-6 overflow-x-auto">
                <h3 className="text-sm font-700 text-surface-800 mb-4">Service Communication Details</h3>
                {net_metrics.length === 0 ? <div className="text-center text-surface-300 py-10">No network data</div> : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-100">
                        {['Source','Target','Latency','RX kB/s','TX kB/s','TCP','HTTP/s','Pkt Loss'].map(h => (
                          <th key={h} className="pb-3 text-left text-xs font-600 text-surface-400 uppercase tracking-wider pr-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-50">
                      {net_metrics.map((l, i) => (
                        <tr key={i} className="table-row-hover">
                          <td className="py-3 pr-4 font-600 text-surface-800 text-xs">{l.source_service}</td>
                          <td className="py-3 pr-4 text-xs text-surface-600">{l.target_service}</td>
                          <td className="py-3 pr-4">
                            <span className={`text-xs font-700 px-2 py-0.5 rounded-lg ${l.latency_ms > 500 ? 'bg-danger-50 text-danger-600' : l.latency_ms > 200 ? 'bg-warning-50 text-warning-600' : 'bg-success-50 text-success-600'}`}>
                              {l.latency_ms.toFixed(0)}ms
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-xs text-surface-600">{((l.receive_bytes_sec || 0) / 1024).toFixed(1)}</td>
                          <td className="py-3 pr-4 text-xs text-surface-600">{((l.transmit_bytes_sec || 0) / 1024).toFixed(1)}</td>
                          <td className="py-3 pr-4 text-xs text-surface-600">{l.tcp_connections}</td>
                          <td className="py-3 pr-4 text-xs text-surface-600">{l.http_request_rate?.toFixed(1)}</td>
                          <td className="py-3 text-xs font-600 text-danger-600">{l.packet_loss_rate > 0 ? `${l.packet_loss_rate.toFixed(2)}%` : <span className="text-success-600">0%</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
