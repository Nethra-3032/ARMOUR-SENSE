import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  Filter,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  Layers,
  AlertTriangle,
  CheckCircle,
  Cpu
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { DatasetSummary, DatasetRecord } from '../types';

export const DatasetPage: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [records, setRecords] = useState<DatasetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);

  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [search, setSearch] = useState('');
  const [productType, setProductType] = useState('ALL');
  const [failureType, setFailureType] = useState('ALL');
  const [target, setTarget] = useState('ALL');

  // Selected Record Inspection Modal
  const [selectedRecord, setSelectedRecord] = useState<DatasetRecord | null>(null);

  const loadSummary = async () => {
    try {
      const sum = await apiService.getDatasetSummary();
      setSummary(sum);
    } catch (err) {
      console.error('Failed to load dataset summary', err);
    }
  };

  const loadRecords = async () => {
    try {
      setTableLoading(true);
      const res = await apiService.getDatasetRecords({
        page,
        page_size: pageSize,
        search: search.trim() || undefined,
        product_type: productType !== 'ALL' ? productType : undefined,
        failure_type: failureType !== 'ALL' ? failureType : undefined,
        target: target !== 'ALL' ? parseInt(target) : undefined,
      });
      setRecords(res.records);
      setTotalPages(res.total_pages);
      setTotalRecords(res.total);
    } catch (err) {
      console.error('Failed to load records', err);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadSummary(), loadRecords()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadRecords();
  }, [page, pageSize, productType, failureType, target]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadRecords();
  };

  // Prepare Chart Data
  const failureChartData = summary
    ? Object.entries(summary.failure_type_distribution)
        .filter(([type]) => type !== 'No Failure')
        .map(([type, count]) => ({
          type: type.replace(' Failure', '').replace(' Failures', ''),
          fullName: type,
          count,
        }))
    : [];

  const typeChartData = summary
    ? Object.entries(summary.product_type_distribution).map(([type, count]) => ({
        type: `Class ${type}`,
        count,
      }))
    : [];

  const CHART_COLORS = ['#ef4444', '#f59e0b', '#06b6d4', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="hud-panel p-4 lg:p-6 rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl lg:text-2xl font-black font-orbitron tracking-wide text-white uppercase">
              Fleet Telemetry Data Lake (10,000 Records)
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono-code mt-1">
            Empirical multi-variate telemetry database with verified ground-truth failure classifications
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono-code text-cyan-300 bg-cyan-950/40 px-3 py-1.5 rounded-lg border border-cyan-500/30">
            100% COMPLETE • 0 MISSING VALUES
          </span>
        </div>
      </div>

      {/* Dataset KPI Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="hud-panel p-4 rounded-xl border border-slate-800">
            <span className="text-xs font-mono-code uppercase text-slate-400">Total Observations</span>
            <div className="text-2xl font-bold font-orbitron text-white mt-1">
              {summary.total_records.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 font-mono-code mt-1">10 telemetry features</p>
          </div>

          <div className="hud-panel p-4 rounded-xl border border-slate-800">
            <span className="text-xs font-mono-code uppercase text-slate-400">Normal Operations</span>
            <div className="text-2xl font-bold font-orbitron text-emerald-400 mt-1">
              {summary.normal_records.toLocaleString()}
            </div>
            <p className="text-[11px] text-emerald-500 font-mono-code mt-1">
              {((summary.normal_records / summary.total_records) * 100).toFixed(1)}% Nominal
            </p>
          </div>

          <div className="hud-panel p-4 rounded-xl border border-slate-800">
            <span className="text-xs font-mono-code uppercase text-slate-400">Failures Detected</span>
            <div className="text-2xl font-bold font-orbitron text-red-400 mt-1">
              {summary.failure_records.toLocaleString()}
            </div>
            <p className="text-[11px] text-red-400 font-mono-code mt-1">
              {summary.failure_rate_percentage.toFixed(2)}% Baseline Failure Rate
            </p>
          </div>

          <div className="hud-panel p-4 rounded-xl border border-slate-800">
            <span className="text-xs font-mono-code uppercase text-slate-400">Armor Variants</span>
            <div className="text-2xl font-bold font-orbitron text-cyan-400 mt-1">
              L / M / H
            </div>
            <p className="text-[11px] text-cyan-300 font-mono-code mt-1">
              L: 50% | M: 30% | H: 20%
            </p>
          </div>
        </div>
      )}

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Failure Breakdown Chart (7 cols) */}
        <div className="lg:col-span-7 hud-panel p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-2">
            <span className="text-xs font-mono-code uppercase font-semibold text-cyan-400 tracking-wider flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4" />
              Failure Modes Distribution (339 Verified Cases)
            </span>
            <span className="text-[10px] font-mono-code text-slate-500">
              Ground Truth
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={failureChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="type" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0d131f',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                  }}
                  formatter={(val: any, name: any, item: any) => [`${val} occurrences`, item.payload.fullName]}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {failureChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Armor Class Distribution (5 cols) */}
        <div className="lg:col-span-5 hud-panel p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-2">
            <span className="text-xs font-mono-code uppercase font-semibold text-cyan-400 tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              Fleet Distribution By Armor Class
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeChartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="type" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0d131f',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="hud-panel p-4 rounded-xl border border-slate-800 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Product ID (e.g. M14860, L47181)..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950/80 border border-slate-700 text-xs text-white font-mono-code focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={productType}
              onChange={(e) => {
                setPage(1);
                setProductType(e.target.value);
              }}
              className="px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-700 text-xs text-slate-300 font-mono-code focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Armor Types (L, M, H)</option>
              <option value="L">Type L (Light Recon)</option>
              <option value="M">Type M (Medium IFV)</option>
              <option value="H">Type H (Heavy Armor)</option>
            </select>

            <select
              value={failureType}
              onChange={(e) => {
                setPage(1);
                setFailureType(e.target.value);
              }}
              className="px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-700 text-xs text-slate-300 font-mono-code focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Failure Modes</option>
              <option value="No Failure">No Failure</option>
              <option value="Heat Dissipation Failure">Heat Dissipation (HDF)</option>
              <option value="Power Failure">Power Failure (PWF)</option>
              <option value="Overstrain Failure">Overstrain Failure (OSF)</option>
              <option value="Tool Wear Failure">Tool Wear Failure (TWF)</option>
              <option value="Random Failures">Random Failure (RNF)</option>
            </select>

            <select
              value={target}
              onChange={(e) => {
                setPage(1);
                setTarget(e.target.value);
              }}
              className="px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-700 text-xs text-slate-300 font-mono-code focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Target States</option>
              <option value="0">Nominal Only (Target=0)</option>
              <option value="1">Failures Only (Target=1)</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono-code text-xs uppercase font-bold transition-colors"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Dataset Records Table */}
      <div className="hud-panel p-5 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono-code uppercase font-semibold text-white tracking-wider">
              Telemetry Records Table
            </span>
            <span className="text-xs font-mono-code text-slate-400">
              ({totalRecords.toLocaleString()} matching records)
            </span>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-3 text-xs font-mono-code">
            <span className="text-slate-400">
              Page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong>
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || tableLoading}
                className="p-1.5 rounded bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || tableLoading}
                className="p-1.5 rounded bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {tableLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs font-mono-code">
            <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mb-2" />
            <span>Loading telemetry rows...</span>
          </div>
        ) : records.length === 0 ? (
          <p className="py-8 text-center text-xs font-mono-code text-slate-500">
            No records match the current filter query.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono-code">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                  <th className="pb-2">UDI</th>
                  <th className="pb-2">Product ID</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Air Temp</th>
                  <th className="pb-2">Process Temp</th>
                  <th className="pb-2">Rot. Speed</th>
                  <th className="pb-2">Torque</th>
                  <th className="pb-2">Tool Wear</th>
                  <th className="pb-2">Target</th>
                  <th className="pb-2">Failure Mode</th>
                  <th className="pb-2 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {records.map((r) => {
                  const isFail = r.target === 1;
                  return (
                    <tr
                      key={r.udi}
                      onClick={() => setSelectedRecord(r)}
                      className="hover:bg-slate-900/50 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 text-slate-500">{r.udi}</td>
                      <td className="py-2.5 text-white font-bold">{r.product_id}</td>
                      <td className="py-2.5">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold border border-slate-700">
                          {r.type}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-300">{r.air_temperature.toFixed(1)} K</td>
                      <td className="py-2.5 text-slate-300">{r.process_temperature.toFixed(1)} K</td>
                      <td className="py-2.5 text-slate-300">{r.rotational_speed} RPM</td>
                      <td className="py-2.5 text-slate-300">{r.torque.toFixed(1)} Nm</td>
                      <td className="py-2.5 text-slate-300">{r.tool_wear} min</td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isFail
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {isFail ? 'FAIL' : 'OK'}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`font-semibold ${
                            r.failure_type === 'No Failure' ? 'text-slate-400' : 'text-red-400'
                          }`}
                        >
                          {r.failure_type}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500 hover:text-cyan-400 inline" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Inspector Drawer / Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#0b121e] border border-cyan-500/40 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden hud-panel">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold font-orbitron tracking-wide text-white">
                  RECORD INSPECTOR • {selectedRecord.product_id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-mono-code">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                <div>
                  <span className="text-slate-400 text-[10px]">PRODUCT ID</span>
                  <div className="text-white font-bold">{selectedRecord.product_id}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">ARMOR VARIANT</span>
                  <div className="text-white font-bold">Type {selectedRecord.type}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">AIR TEMPERATURE</span>
                  <div className="text-white font-bold">{selectedRecord.air_temperature.toFixed(1)} K</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">PROCESS TEMPERATURE</span>
                  <div className="text-white font-bold">{selectedRecord.process_temperature.toFixed(1)} K</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">ROTATIONAL SPEED</span>
                  <div className="text-white font-bold">{selectedRecord.rotational_speed} RPM</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">TORQUE LOAD</span>
                  <div className="text-white font-bold">{selectedRecord.torque.toFixed(1)} Nm</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">TOOL ABRASION / WEAR</span>
                  <div className="text-white font-bold">{selectedRecord.tool_wear} min</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">GROUND TRUTH OUTCOME</span>
                  <div className={selectedRecord.target === 1 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {selectedRecord.failure_type}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    navigate('/predict');
                  }}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Send To Diagnostic Studio</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
