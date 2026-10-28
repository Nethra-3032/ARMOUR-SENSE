import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Zap,
  Flame,
  Thermometer,
  Gauge,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Send,
  Trash2,
  RefreshCw,
  Info,
  HelpCircle
} from 'lucide-react';
import { GaugeChart } from '../components/GaugeChart';
import { RiskBadge } from '../components/RiskBadge';
import { CreateWorkOrderModal } from '../components/CreateWorkOrderModal';
import { apiService } from '../services/api';
import { SensorInput, PredictionResponse, PredictionHistoryItem } from '../types';

interface Preset {
  name: string;
  desc: string;
  data: SensorInput;
}

const PRESETS: Preset[] = [
  {
    name: 'Normal Recon Patrol',
    desc: 'Optimal operating temperatures, balanced speed and nominal torque load.',
    data: {
      product_type: 'M',
      air_temperature: 298.5,
      process_temperature: 308.7,
      rotational_speed: 1510,
      torque: 41.2,
      tool_wear: 35,
    },
  },
  {
    name: 'Thermal Dissipation Failure (HDF)',
    desc: 'Elevated ambient temperature with inadequate temperature differential cooling.',
    data: {
      product_type: 'L',
      air_temperature: 304.5,
      process_temperature: 313.2,
      rotational_speed: 1350,
      torque: 58.0,
      tool_wear: 110,
    },
  },
  {
    name: 'Power / Spindle Stall (PWF)',
    desc: 'Extreme power surge with high torque (>65 Nm) or sudden mechanical rpm drop.',
    data: {
      product_type: 'H',
      air_temperature: 299.0,
      process_temperature: 309.2,
      rotational_speed: 1220,
      torque: 72.5,
      tool_wear: 80,
    },
  },
  {
    name: 'Critical Tool Abrasion (TWF)',
    desc: 'Severe continuous tool wear beyond safety limit (>215 min) risking catastrophic fracture.',
    data: {
      product_type: 'M',
      air_temperature: 301.0,
      process_temperature: 311.5,
      rotational_speed: 1480,
      torque: 46.0,
      tool_wear: 232,
    },
  },
  {
    name: 'Overstrain Shock Load (OSF)',
    desc: 'Combined high torque and excessive tool wear leading to structural yield failure.',
    data: {
      product_type: 'L',
      air_temperature: 302.2,
      process_temperature: 311.8,
      rotational_speed: 1390,
      torque: 64.0,
      tool_wear: 205,
    },
  },
];

export const PredictPage: React.FC = () => {
  const [inputs, setInputs] = useState<SensorInput>(PRESETS[0].data);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<PredictionHistoryItem[]>([]);
  const [activePreset, setActivePreset] = useState<string>(PRESETS[0].name);

  // Dispatch Modal
  const [modalOpen, setModalOpen] = useState(false);

  // Computed engineering features
  const tempDiff = +(inputs.process_temperature - inputs.air_temperature).toFixed(1);
  const powerWatts = Math.round((inputs.rotational_speed * inputs.torque * 2 * Math.PI) / 60);

  const fetchHistory = async () => {
    try {
      const hist = await apiService.getPredictionHistory(10);
      setHistory(hist);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchHistory();
    handlePredict(PRESETS[0].data);
  }, []);

  const handlePredict = async (dataToPredict = inputs) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.predict(dataToPredict);
      setResult(res);
      fetchHistory();
    } catch (err: any) {
      setError(err?.message || 'Failed to execute inference');
    } finally {
      setLoading(false);
    }
  };

  const selectPreset = (preset: Preset) => {
    setActivePreset(preset.name);
    setInputs(preset.data);
    handlePredict(preset.data);
  };

  const handleClearHistory = async () => {
    try {
      await apiService.clearPredictionHistory();
      setHistory([]);
    } catch (err: any) {
      alert('Failed to clear history: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="hud-panel p-4 lg:p-6 rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl lg:text-2xl font-black font-orbitron tracking-wide text-white uppercase">
              AI Diagnostic Studio & Predictor
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono-code mt-1">
            Simulate combat sensor parameters, test failure boundaries, and examine XAI feature attributions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono-code text-cyan-300 bg-cyan-950/40 px-3 py-1.5 rounded-lg border border-cyan-500/30">
            MODEL: ENSEMBLE CLASSIFIER v1.0
          </span>
        </div>
      </div>

      {/* Preset Tactical Scenario Selector */}
      <div className="hud-panel p-4 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono-code uppercase text-slate-300 font-semibold tracking-wider flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Tactical Simulation Scenarios & Failure Mode Presets
          </span>
          <span className="text-[10px] font-mono-code text-slate-500">
            One-click parameter baseline loading
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {PRESETS.map((p) => {
            const isSelected = activePreset === p.name;
            return (
              <button
                key={p.name}
                onClick={() => selectPreset(p)}
                className={`p-3 rounded-lg text-left transition-all border ${
                  isSelected
                    ? 'bg-cyan-950/60 border-cyan-500 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold text-white font-mono-code truncate">
                  {p.name}
                </div>
                <div className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                  {p.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Two-Column Layout: Sliders on Left, Results on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders Form (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="hud-panel p-5 rounded-xl border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <span className="text-xs font-mono-code uppercase font-semibold text-cyan-400 tracking-wider">
                Telemetry Inputs & Sensor Sliders
              </span>
              <span className="text-[11px] font-mono-code text-slate-400">
                Type: <strong className="text-white">{inputs.product_type}</strong>
              </span>
            </div>

            {/* Armor / Vehicle Variant Type */}
            <div>
              <label className="block text-xs font-mono-code text-slate-300 uppercase tracking-wider mb-2">
                Combat Armor / Asset Variant (Product Type)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'L', label: 'L - Light Recon (50% Fleet)' },
                  { id: 'M', label: 'M - Medium IFV (30% Fleet)' },
                  { id: 'H', label: 'H - Heavy Tank (20% Fleet)' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setActivePreset('Custom');
                      setInputs({ ...inputs, product_type: t.id as any });
                    }}
                    className={`p-2 rounded-lg text-xs font-mono-code font-bold transition-all border ${
                      inputs.product_type === t.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Air Temperature Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono-code">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-sky-400" />
                  Air Temperature [K]
                </span>
                <span className="text-cyan-300 font-bold font-orbitron">
                  {inputs.air_temperature.toFixed(1)} K
                  <span className="text-[10px] text-slate-400 font-sans ml-1">
                    ({(inputs.air_temperature - 273.15).toFixed(1)}°C)
                  </span>
                </span>
              </div>
              <input
                type="range"
                min="295"
                max="305"
                step="0.1"
                value={inputs.air_temperature}
                onChange={(e) => {
                  setActivePreset('Custom');
                  setInputs({ ...inputs, air_temperature: parseFloat(e.target.value) });
                }}
                className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono-code">
                <span>295.0 K (21.9°C)</span>
                <span>305.0 K (31.9°C)</span>
              </div>
            </div>

            {/* Process Temperature Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono-code">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-red-400" />
                  Process Temperature [K]
                </span>
                <span className="text-cyan-300 font-bold font-orbitron">
                  {inputs.process_temperature.toFixed(1)} K
                  <span className="text-[10px] text-slate-400 font-sans ml-1">
                    ({(inputs.process_temperature - 273.15).toFixed(1)}°C)
                  </span>
                </span>
              </div>
              <input
                type="range"
                min="305"
                max="315"
                step="0.1"
                value={inputs.process_temperature}
                onChange={(e) => {
                  setActivePreset('Custom');
                  setInputs({ ...inputs, process_temperature: parseFloat(e.target.value) });
                }}
                className="w-full accent-red-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono-code">
                <span>305.0 K (31.9°C)</span>
                <span>315.0 K (41.9°C)</span>
              </div>
            </div>

            {/* Rotational Speed Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono-code">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                  Rotational Speed [RPM]
                </span>
                <span className="text-cyan-300 font-bold font-orbitron">
                  {inputs.rotational_speed} RPM
                </span>
              </div>
              <input
                type="range"
                min="1150"
                max="2900"
                step="10"
                value={inputs.rotational_speed}
                onChange={(e) => {
                  setActivePreset('Custom');
                  setInputs({ ...inputs, rotational_speed: parseInt(e.target.value) });
                }}
                className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono-code">
                <span>1,150 RPM</span>
                <span>2,900 RPM</span>
              </div>
            </div>

            {/* Torque Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono-code">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  Torque Load [Nm]
                </span>
                <span className="text-cyan-300 font-bold font-orbitron">
                  {inputs.torque.toFixed(1)} Nm
                </span>
              </div>
              <input
                type="range"
                min="3"
                max="80"
                step="0.5"
                value={inputs.torque}
                onChange={(e) => {
                  setActivePreset('Custom');
                  setInputs({ ...inputs, torque: parseFloat(e.target.value) });
                }}
                className="w-full accent-amber-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono-code">
                <span>3.0 Nm (Free run)</span>
                <span>80.0 Nm (Heavy stall)</span>
              </div>
            </div>

            {/* Tool Wear Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono-code">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  Tool Wear / Armor Abrasion [min]
                </span>
                <span className="text-cyan-300 font-bold font-orbitron">
                  {inputs.tool_wear} min
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="260"
                step="1"
                value={inputs.tool_wear}
                onChange={(e) => {
                  setActivePreset('Custom');
                  setInputs({ ...inputs, tool_wear: parseInt(e.target.value) });
                }}
                className="w-full accent-orange-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono-code">
                <span>0 min (Fresh insert)</span>
                <span>260 min (Critical wear limit)</span>
              </div>
            </div>

            {/* Real-time Computed Physical Indicators */}
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 grid grid-cols-2 gap-3 text-xs font-mono-code">
              <div>
                <span className="text-slate-400 text-[10px]">TEMP DIFFERENTIAL</span>
                <p className="text-white font-bold text-sm">
                  {tempDiff} K {tempDiff < 8.6 ? <span className="text-red-400 text-[10px] ml-1">[Low HDF Risk]</span> : ''}
                </p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px]">MECHANICAL POWER</span>
                <p className="text-white font-bold text-sm">
                  {powerWatts.toLocaleString()} W
                  {powerWatts > 9000 || powerWatts < 3500 ? (
                    <span className="text-amber-400 text-[10px] ml-1">[Surge/Stall]</span>
                  ) : ''}
                </p>
              </div>
            </div>

            {/* Inference Submit Button */}
            <button
              onClick={() => handlePredict(inputs)}
              disabled={loading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-cyan-600 via-sky-500 to-cyan-500 hover:from-cyan-500 hover:to-sky-400 text-white font-orbitron font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Cpu className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'CALCULATING ENSEMBLE INFERENCE...' : 'RUN AI TELEMETRY DIAGNOSIS'}</span>
            </button>
          </div>
        </div>

        {/* Results & XAI Feature Attribution Panel (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {error && (
            <div className="hud-panel p-4 rounded-xl border border-red-500/40 bg-red-950/20 text-red-300 text-xs font-mono-code flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="hud-panel p-5 rounded-xl border border-slate-800 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <span className="text-xs font-mono-code uppercase font-semibold text-cyan-400 tracking-wider">
                  Diagnosis & Risk Attribution Output
                </span>
                <RiskBadge category={result.risk_category} score={result.calibrated_risk_score} size="md" />
              </div>

              {/* Gauge + Failure Mode Hero */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="flex justify-center py-2">
                  <GaugeChart
                    value={result.calibrated_risk_score}
                    label="CALIBRATED RISK"
                    sublabel={`Raw ML Prob: ${(result.failure_probability * 100).toFixed(1)}%`}
                    size={190}
                  />
                </div>

                <div className="space-y-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs font-mono-code">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase">Predicted Failure Mode</span>
                    <div className="text-base font-bold font-orbitron text-white mt-0.5">
                      {result.predicted_failure_type || 'No Failure Detected'}
                    </div>
                    {result.type_confidence && (
                      <span className="text-[11px] text-cyan-300">
                        Type Confidence: {(result.type_confidence * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] uppercase">Recommended Field Action</span>
                    <p className="text-slate-200 text-xs mt-0.5 leading-snug">
                      {result.recommended_action}
                    </p>
                  </div>

                  <button
                    onClick={() => setModalOpen(true)}
                    className="w-full mt-2 py-2 rounded bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-mono-code text-xs uppercase font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>DISPATCH WORK ORDER</span>
                  </button>
                </div>
              </div>

              {/* Uncertainty Warning */}
              {result.uncertainty_warning && (
                <div className="p-3 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono-code flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="uppercase">Uncertainty Flag: </strong>
                    <span>{result.uncertainty_warning}</span>
                  </div>
                </div>
              )}

              {/* Rule Engine Alerts */}
              {result.rule_alerts.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-mono-code uppercase font-semibold text-amber-400 tracking-wider">
                    Deterministic Domain Rule Alerts ({result.rule_alerts.length})
                  </span>
                  <div className="space-y-1.5">
                    {result.rule_alerts.map((alert, i) => (
                      <div key={i} className="p-2.5 rounded bg-slate-900/90 border border-amber-500/30 text-xs font-mono-code">
                        <div className="flex items-center justify-between text-amber-300 font-bold">
                          <span>{alert.rule_name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 uppercase">
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px] mt-1">{alert.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Explainable AI (XAI) Feature Contributions */}
              <div className="space-y-2.5 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono-code uppercase font-semibold text-cyan-400 tracking-wider">
                    Explainable AI (XAI) Feature Attributions
                  </span>
                  <span className="text-[10px] font-mono-code text-slate-500">
                    Model Weights
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono-code">
                  {result.feature_contributions.map((fc, i) => {
                    const pct = Math.round(fc.importance_weight * 100);
                    let barColor = 'bg-cyan-500';
                    let statusColor = 'text-slate-400';
                    if (fc.status === 'warning') {
                      barColor = 'bg-amber-400';
                      statusColor = 'text-amber-400';
                    }
                    if (fc.status === 'critical') {
                      barColor = 'bg-red-400';
                      statusColor = 'text-red-400';
                    }

                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-300">{fc.feature}</span>
                          <span className={`${statusColor} font-semibold`}>
                            {fc.note} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${barColor}`}
                            style={{ width: `${Math.max(5, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Prediction History Table */}
      <div className="hud-panel p-5 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold font-orbitron tracking-wide text-white uppercase">
              Prediction Audit History
            </h2>
          </div>
          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-xs font-mono-code text-slate-400 hover:text-red-400 flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <p className="text-xs text-slate-500 font-mono-code text-center py-4">
            No history recorded.
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
                  <th className="pb-2">Wear</th>
                  <th className="pb-2">Risk</th>
                  <th className="pb-2">Failure Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-2 text-slate-400">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2 text-white font-bold">{item.product_type}</td>
                    <td className="py-2 text-slate-300">
                      {item.air_temperature.toFixed(1)}K / {item.process_temperature.toFixed(1)}K
                    </td>
                    <td className="py-2 text-slate-300">
                      {item.rotational_speed} RPM / {item.torque.toFixed(1)} Nm
                    </td>
                    <td className="py-2 text-slate-300">{item.tool_wear} min</td>
                    <td className="py-2">
                      <RiskBadge category={item.risk_category} score={item.risk_score} size="sm" />
                    </td>
                    <td className="py-2 text-cyan-300">
                      {item.predicted_failure_type || 'Nominal'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dispatch Modal */}
      <CreateWorkOrderModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          fetchHistory();
        }}
        initialAssetId={`ASSET-${inputs.product_type}01`}
        initialIssue={`Automated AI Prediction Alert: ${result?.predicted_failure_type || 'Elevated Risk'} (Risk: ${result?.calibrated_risk_score.toFixed(1)}%) - Action: ${result?.recommended_action}`}
        initialPriority={result?.risk_category === 'Critical' ? 'Critical' : 'High'}
      />
    </div>
  );
};
