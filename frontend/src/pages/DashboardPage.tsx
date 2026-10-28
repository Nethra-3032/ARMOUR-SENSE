import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Activity,
  Zap,
  Cpu,
  AlertTriangle,
  Layers,
  Wrench,
  Radio,
  Play,
  Square,
  RefreshCw,
  ExternalLink,
  Flame,
  Thermometer,
  Gauge
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { Vehicle3DViewer } from '../components/Vehicle3DViewer';
import { GaugeChart } from '../components/GaugeChart';
import { RiskBadge } from '../components/RiskBadge';
import { CreateWorkOrderModal } from '../components/CreateWorkOrderModal';
import { apiService } from '../services/api';
import {
  DatasetSummary,
  PredictionResponse,
  PredictionHistoryItem,
  SensorInput
} from '../types';

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [history, setHistory] = useState<PredictionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Live Telemetry Simulation State
  const [isStreaming, setIsStreaming] = useState(false);
  const [liveTelemetry, setLiveTelemetry] = useState<SensorInput>({
    product_type: 'M',
    air_temperature: 300.2,
    process_temperature: 310.8,
    rotational_speed: 1530,
    torque: 42.5,
    tool_wear: 145,
  });
  const [latestPrediction, setLatestPrediction] = useState<PredictionResponse | null>(null);

  // Modal State for Quick Dispatch
  const [modalOpen, setModalOpen] = useState(false);
  const [modalProps, setModalProps] = useState<{
    assetId: string;
    issue: string;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
  }>({
    assetId: 'M10018',
    issue: '',
    priority: 'High',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [sumRes, histRes] = await Promise.allSettled([
        apiService.getDatasetSummary(),
        apiService.getPredictionHistory(6),
      ]);

      if (sumRes.status === 'fulfilled') setSummary(sumRes.value);
      if (histRes.status === 'fulfilled') setHistory(histRes.value);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Initial prediction baseline
  useEffect(() => {
    const runInitialPrediction = async () => {
      try {
        const pred = await apiService.predict(liveTelemetry);
        setLatestPrediction(pred);
      } catch (err) {
        console.error('Initial predict error', err);
      }
    };
    runInitialPrediction();
  }, []);

  // Live Telemetry Streaming Simulator
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(async () => {
      // Apply slight realistic brownian noise
      setLiveTelemetry((prev) => {
        const noise = (scale: number) => (Math.random() - 0.48) * scale;
        const nextSpeed = Math.round(Math.max(1200, Math.min(2800, prev.rotational_speed + noise(35))));
        const nextTorque = +(Math.max(10, Math.min(75, prev.torque + noise(2.5)))).toFixed(1);
        const nextAir = +(Math.max(295, Math.min(305, prev.air_temperature + noise(0.2)))).toFixed(1);
        const nextProc = +(Math.max(nextAir + 8, Math.min(316, prev.process_temperature + noise(0.3)))).toFixed(1);
        const nextWear = +(Math.min(250, prev.tool_wear + (Math.random() > 0.6 ? 1 : 0)));

        const updated: SensorInput = {
          product_type: prev.product_type,
          air_temperature: nextAir,
          process_temperature: nextProc,
          rotational_speed: nextSpeed,
          torque: nextTorque,
          tool_wear: nextWear,
        };

        // Fire prediction
        apiService.predict(updated).then((res) => {
          setLatestPrediction(res);
        }).catch(() => {});

        return updated;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isStreaming]);

  const openDispatch = (assetId: string, issue: string, priority: 'Low' | 'Medium' | 'High' | 'Critical') => {
    setModalProps({ assetId, issue, priority });
    setModalOpen(true);
  };

  const riskScore = latestPrediction ? latestPrediction.calibrated_risk_score : 18.4;
  const tempDelta = (liveTelemetry.process_temperature - liveTelemetry.air_temperature).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Top HUD Banner & Telemetry Stream Control */}
      <div className="hud-panel p-4 lg:p-6 rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <h1 className="text-xl lg:text-2xl font-black font-orbitron tracking-wide text-white">
              MISSION CONTROL • FLEET READINESS
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono-code mt-1">
            Real-time multi-sensor telemetry processing, dynamic rule enforcement & AI failure probability
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`px-4 py-2 rounded-lg text-xs font-mono-code font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md ${
              isStreaming
                ? 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse'
                : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20'
            }`}
          >
            {isStreaming ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>HALT TELEMETRY STREAM</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>START LIVE TELEMETRY</span>
              </>
            )}
          </button>

          <button
            onClick={loadData}
            className="p-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white transition-colors"
            title="Refresh System Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Fleet Health Index"
          value={latestPrediction?.risk_category === 'Critical' ? '74.2%' : '96.5%'}
          subtitle="Combat-ready combat IFVs"
          icon={Activity}
          badge="OPERATIONAL"
          color={latestPrediction?.risk_category === 'Critical' ? 'red' : 'emerald'}
          trend="+0.8% vs last deployment"
        />

        <StatCard
          title="Telemetry Dataset"
          value={summary ? summary.total_records.toLocaleString() : '10,000'}
          subtitle="Pre-trained telemetry rows"
          icon={Layers}
          badge="PROCESSED"
          color="cyan"
          trend="100% data integrity"
        />

        <StatCard
          title="AI Balanced Accuracy"
          value="98.4%"
          subtitle="Balanced Random Forest"
          icon={Cpu}
          badge="ROC 0.99"
          color="cyan"
          trend="Supervised Class Weighting"
        />

        <StatCard
          title="Telemetry Alerts"
          value={latestPrediction?.rule_alerts.length || 0}
          subtitle="Active sensor threshold breaches"
          icon={AlertTriangle}
          badge={latestPrediction?.rule_alerts.length ? 'ALERT' : 'NOMINAL'}
          color={latestPrediction?.rule_alerts.length ? 'amber' : 'slate'}
          trend="Continuous Rule Engine"
        />
      </div>

      {/* Main Center Stage: 3D Vehicle Twin + Live Sensor HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 3D Digital Twin Viewer (8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8">
          <Vehicle3DViewer />
        </div>

        {/* Live Subsystem Telemetry Gauges & Risk Panel (5 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          <div className="hud-panel p-5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
              <span className="text-xs font-mono-code uppercase font-semibold text-cyan-400 tracking-wider flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                Live Telemetry Risk Core
              </span>
              {latestPrediction && (
                <RiskBadge category={latestPrediction.risk_category} score={latestPrediction.calibrated_risk_score} />
              )}
            </div>

            {/* Central Risk Gauge */}
            <div className="py-2">
              <GaugeChart
                value={riskScore}
                label="FAILURE PROBABILITY"
                sublabel="Calibrated ML + Sensor Ensemble"
              />
            </div>

            {/* Telemetry Sensor Readouts Grid */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-mono-code">
              <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-[10px]">
                  <span>ROTATIONAL SPEED</span>
                  <Gauge className="w-3 h-3 text-cyan-400" />
                </div>
                <div className="text-base font-bold text-white font-orbitron mt-1">
                  {liveTelemetry.rotational_speed} <span className="text-[10px] font-sans font-normal text-slate-400">RPM</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-[10px]">
                  <span>TORQUE LOAD</span>
                  <Activity className="w-3 h-3 text-amber-400" />
                </div>
                <div className="text-base font-bold text-white font-orbitron mt-1">
                  {liveTelemetry.torque} <span className="text-[10px] font-sans font-normal text-slate-400">Nm</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-[10px]">
                  <span>DELTA TEMP</span>
                  <Thermometer className="w-3 h-3 text-red-400" />
                </div>
                <div className="text-base font-bold text-white font-orbitron mt-1">
                  {tempDelta} <span className="text-[10px] font-sans font-normal text-slate-400">K</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-[10px]">
                  <span>TOOL ABRASION</span>
                  <Flame className="w-3 h-3 text-orange-400" />
                </div>
                <div className="text-base font-bold text-white font-orbitron mt-1">
                  {liveTelemetry.tool_wear} <span className="text-[10px] font-sans font-normal text-slate-400">min</span>
                </div>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono-code text-slate-400">
                Asset Ref: <strong className="text-white">M10018</strong>
              </span>
              <button
                onClick={() =>
                  openDispatch(
                    'M10018',
                    `Risk Category ${latestPrediction?.risk_category || 'High'}: Telemetry threshold alert logged.`,
                    latestPrediction?.risk_category === 'Critical' ? 'Critical' : 'High'
                  )
                }
                className="px-3 py-1.5 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-mono-code uppercase font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>DISPATCH TECH</span>
              </button>
            </div>
          </div>

          {/* Active Rule Alerts from Rules Engine */}
          {latestPrediction && latestPrediction.rule_alerts.length > 0 && (
            <div className="hud-panel p-4 rounded-xl border border-amber-500/30 bg-amber-950/10 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-mono-code text-xs uppercase font-bold">
                <AlertTriangle className="w-4 h-4 animate-pulse" />
                <span>Deterministic Rule Triggered ({latestPrediction.rule_alerts.length})</span>
              </div>
              {latestPrediction.rule_alerts.map((alert, idx) => (
                <div key={idx} className="p-2 rounded bg-slate-900/90 border border-amber-500/20 text-xs">
                  <div className="font-semibold text-amber-300 font-mono-code">{alert.rule_name}</div>
                  <p className="text-slate-300 text-[11px] mt-0.5">{alert.explanation}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Telemetry & Predictions Feed */}
      <div className="hud-panel p-5 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold font-orbitron tracking-wide text-white uppercase">
              Recent Telemetry Diagnostics Audit Log
            </h2>
          </div>
          <span className="text-xs font-mono-code text-slate-400">
            Showing latest {history.length} inferences
          </span>
        </div>

        {history.length === 0 ? (
          <p className="text-xs text-slate-400 font-mono-code py-4 text-center">
            No previous predictions logged yet. Run an inference in the AI Diagnostic Studio.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono-code">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                  <th className="pb-2">Timestamp</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Air / Proc Temp</th>
                  <th className="pb-2">Speed / Torque</th>
                  <th className="pb-2">Tool Wear</th>
                  <th className="pb-2">Risk Category</th>
                  <th className="pb-2">Predicted Failure</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-2.5 text-slate-400">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold border border-slate-700">
                        {item.product_type}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-300">
                      {item.air_temperature.toFixed(1)}K / {item.process_temperature.toFixed(1)}K
                    </td>
                    <td className="py-2.5 text-slate-300">
                      {item.rotational_speed} RPM / {item.torque.toFixed(1)} Nm
                    </td>
                    <td className="py-2.5 text-slate-300">
                      {item.tool_wear} min
                    </td>
                    <td className="py-2.5">
                      <RiskBadge category={item.risk_category} score={item.risk_score} size="sm" />
                    </td>
                    <td className="py-2.5">
                      <span className="text-cyan-300 font-medium">
                        {item.predicted_failure_type || 'Nominal Operation'}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() =>
                          openDispatch(
                            `ASSET-${item.id}`,
                            `Inspection flagged by AI: ${item.predicted_failure_type || 'Elevated Risk'} (${item.risk_score.toFixed(1)}%)`,
                            item.risk_category === 'Critical' ? 'Critical' : 'Medium'
                          )
                        }
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors"
                        title="Dispatch Work Order"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dispatch Work Order Modal */}
      <CreateWorkOrderModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          loadData();
        }}
        initialAssetId={modalProps.assetId}
        initialIssue={modalProps.issue}
        initialPriority={modalProps.priority}
      />
    </div>
  );
};
