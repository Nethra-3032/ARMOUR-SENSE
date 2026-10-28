import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Shield,
  Sliders,
  Wifi,
  WifiOff,
  Cpu,
  CheckCircle,
  AlertTriangle,
  Save,
  Radio,
  Info
} from 'lucide-react';
import { apiService } from '../services/api';
import { SystemSettings } from '../types';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Local state for thresholds
  const [thresholds, setThresholds] = useState({
    threshold_low: 15,
    threshold_moderate: 40,
    threshold_high: 70,
    threshold_critical: 85,
  });

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await apiService.getSystemSettings();
      setSettings(data);
      if (data.thresholds) {
        setThresholds({
          threshold_low: data.thresholds.low,
          threshold_moderate: data.thresholds.moderate,
          threshold_high: data.thresholds.high,
          threshold_critical: data.thresholds.critical,
        });
      }
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveThresholds = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(null);
    try {
      const res = await apiService.updateThresholds(thresholds);
      setSaveSuccess(res.message);
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: any) {
      alert('Failed to update thresholds: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="hud-panel p-4 lg:p-6 rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl lg:text-2xl font-black font-orbitron tracking-wide text-white uppercase">
              System Architecture & Hardware Calibration
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono-code mt-1">
            Configure risk classification boundaries, review telemetry bus interfaces, and inspect hardware status
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono-code text-cyan-300 bg-cyan-950/40 px-3 py-1.5 rounded-lg border border-cyan-500/30">
            ARMORSENSE TACTICAL v1.0
          </span>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono-code flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Grid: Threshold Tuning & Hardware Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Risk Thresholds Form (7 cols) */}
        <div className="lg:col-span-7 hud-panel p-5 rounded-xl border border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <span className="text-xs font-mono-code uppercase font-semibold text-cyan-400 tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4" />
              Dynamic Risk Boundary Calibration (%)
            </span>
            <span className="text-[10px] font-mono-code text-slate-400">
              Live Evaluation Cutoffs
            </span>
          </div>

          <form onSubmit={handleSaveThresholds} className="space-y-4">
            {/* Low Risk Limit */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono-code">
                <span className="text-slate-300">Nominal / Low Risk Ceiling</span>
                <span className="text-emerald-400 font-bold font-orbitron">
                  &lt; {thresholds.threshold_low}%
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="25"
                step="1"
                value={thresholds.threshold_low}
                onChange={(e) => setThresholds({ ...thresholds, threshold_low: parseInt(e.target.value) })}
                className="w-full accent-emerald-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Moderate Risk Limit */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono-code">
                <span className="text-slate-300">Moderate Risk Cutoff</span>
                <span className="text-amber-400 font-bold font-orbitron">
                  {thresholds.threshold_low}% - {thresholds.threshold_moderate}%
                </span>
              </div>
              <input
                type="range"
                min="25"
                max="50"
                step="1"
                value={thresholds.threshold_moderate}
                onChange={(e) => setThresholds({ ...thresholds, threshold_moderate: parseInt(e.target.value) })}
                className="w-full accent-amber-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* High Risk Limit */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono-code">
                <span className="text-slate-300">High Risk Threshold</span>
                <span className="text-orange-400 font-bold font-orbitron">
                  {thresholds.threshold_moderate}% - {thresholds.threshold_high}%
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="80"
                step="1"
                value={thresholds.threshold_high}
                onChange={(e) => setThresholds({ ...thresholds, threshold_high: parseInt(e.target.value) })}
                className="w-full accent-orange-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Critical Risk Limit */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono-code">
                <span className="text-slate-300">Critical Risk Floor</span>
                <span className="text-red-400 font-bold font-orbitron">
                  &gt; {thresholds.threshold_critical}%
                </span>
              </div>
              <input
                type="range"
                min="70"
                max="95"
                step="1"
                value={thresholds.threshold_critical}
                onChange={(e) => setThresholds({ ...thresholds, threshold_critical: parseInt(e.target.value) })}
                className="w-full accent-red-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono-code text-xs uppercase font-bold tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'UPDATING THRESHOLDS...' : 'SAVE THRESHOLD BOUNDARIES'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Hardware Interface & Disclosure (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="hud-panel p-5 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-mono-code uppercase font-semibold text-cyan-400 tracking-wider">
                Telemetry Bus Status
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-mono-code text-amber-400">
                <WifiOff className="w-3.5 h-3.5" />
                SIMULATED
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono-code">
              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 flex justify-between">
                <span className="text-slate-400">OBD-II / CAN Interface</span>
                <span className="text-amber-400 font-semibold">Virtual Simulator Active</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Baud Rate Protocol</span>
                <span className="text-white">ISO 15765-4 (500 kbit/s)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Active Operating Mode</span>
                <span className="text-cyan-300 font-bold">Standard Simulation Mode</span>
              </div>
            </div>

            {/* Prototype Disclosure Note */}
            <div className="p-3 rounded-lg bg-slate-900/90 border border-cyan-500/20 text-xs font-mono-code text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold uppercase text-[11px]">
                <Info className="w-3.5 h-3.5" />
                <span>Prototype Scope Disclosure</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                ARMORSENSE model training is performed on multi-variate industrial machinery sensor telemetry (10,000 records). Outputs are probabilistic decision-support estimates and do not guarantee mechanical immunity or replace manufacturer safety inspections.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
