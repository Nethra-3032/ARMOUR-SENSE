import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Award,
  Layers,
  Zap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  BarChart2,
  Sliders
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
import { apiService } from '../services/api';
import { ModelMetrics, FeatureImportanceItem } from '../types';

export const ModelLabPage: React.FC = () => {
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [features, setFeatures] = useState<FeatureImportanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [retrainSuccess, setRetrainSuccess] = useState<string | null>(null);

  const loadModelData = async () => {
    try {
      setLoading(true);
      const [metricsRes, featsRes] = await Promise.all([
        apiService.getModelMetrics(),
        apiService.getFeatureImportance(),
      ]);
      setMetrics(metricsRes);
      setFeatures(featsRes.feature_importances);
    } catch (err) {
      console.error('Failed to load model metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModelData();
  }, []);

  const handleRetrain = async () => {
    setRetraining(true);
    setRetrainSuccess(null);
    try {
      const res = await apiService.retrainModel();
      setMetrics(res.metrics);
      setRetrainSuccess(`Model retrained successfully at ${new Date(res.updated_at).toLocaleTimeString()}`);
    } catch (err: any) {
      alert('Retrain error: ' + err.message);
    } finally {
      setRetraining(false);
    }
  };

  const featureChartData = features.map((f) => ({
    name: f.feature,
    importance: +(f.importance * 100).toFixed(1),
    desc: f.description,
  }));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="hud-panel p-4 lg:p-6 rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl lg:text-2xl font-black font-orbitron tracking-wide text-white uppercase">
              Model Lab & Explainable AI (XAI)
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono-code mt-1">
            Supervised Ensemble Random Forest with cost-sensitive class balancing & feature attribution
          </p>
        </div>

        <button
          onClick={handleRetrain}
          disabled={retraining}
          className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono-code text-xs uppercase font-bold tracking-wider flex items-center gap-2 transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${retraining ? 'animate-spin' : ''}`} />
          <span>{retraining ? 'RETRAINING ENSEMBLE...' : 'TRIGGER MODEL RETRAIN'}</span>
        </button>
      </div>

      {retrainSuccess && (
        <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono-code flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{retrainSuccess}</span>
        </div>
      )}

      {/* Model Performance KPI Cards */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="hud-panel p-4 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] font-mono-code uppercase text-slate-400">Accuracy</span>
            <div className="text-xl lg:text-2xl font-black font-orbitron text-emerald-400 mt-1">
              {(metrics.accuracy * 100).toFixed(1)}%
            </div>
            <p className="text-[10px] text-slate-500 font-mono-code mt-0.5">Test Partition</p>
          </div>

          <div className="hud-panel p-4 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] font-mono-code uppercase text-slate-400">Balanced Acc</span>
            <div className="text-xl lg:text-2xl font-black font-orbitron text-cyan-400 mt-1">
              {(metrics.balanced_accuracy * 100).toFixed(1)}%
            </div>
            <p className="text-[10px] text-slate-500 font-mono-code mt-0.5">Class Adjusted</p>
          </div>

          <div className="hud-panel p-4 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] font-mono-code uppercase text-slate-400">Precision</span>
            <div className="text-xl lg:text-2xl font-black font-orbitron text-sky-400 mt-1">
              {(metrics.precision * 100).toFixed(1)}%
            </div>
            <p className="text-[10px] text-slate-500 font-mono-code mt-0.5">True Positives</p>
          </div>

          <div className="hud-panel p-4 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] font-mono-code uppercase text-slate-400">Recall / Sensitivity</span>
            <div className="text-xl lg:text-2xl font-black font-orbitron text-amber-400 mt-1">
              {(metrics.recall * 100).toFixed(1)}%
            </div>
            <p className="text-[10px] text-slate-500 font-mono-code mt-0.5">Coverage</p>
          </div>

          <div className="hud-panel p-4 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] font-mono-code uppercase text-slate-400">F1-Score</span>
            <div className="text-xl lg:text-2xl font-black font-orbitron text-purple-400 mt-1">
              {(metrics.f1_score * 100).toFixed(1)}%
            </div>
            <p className="text-[10px] text-slate-500 font-mono-code mt-0.5">Harmonic Mean</p>
          </div>

          <div className="hud-panel p-4 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] font-mono-code uppercase text-slate-400">ROC-AUC</span>
            <div className="text-xl lg:text-2xl font-black font-orbitron text-emerald-300 mt-1">
              {metrics.roc_auc.toFixed(3)}
            </div>
            <p className="text-[10px] text-slate-500 font-mono-code mt-0.5">Discrimination</p>
          </div>
        </div>
      )}

      {/* Grid: Confusion Matrix + Feature Importance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Confusion Matrix (5 cols) */}
        <div className="lg:col-span-5 hud-panel p-5 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-xs font-mono-code uppercase font-semibold text-cyan-400 tracking-wider">
              Test Set Confusion Matrix (2,000 Samples)
            </span>
            <span className="text-[10px] font-mono-code text-slate-400">80/20 Stratified Split</span>
          </div>

          {metrics && metrics.confusion_matrix && (
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
              <div className="grid grid-cols-2 gap-3 text-center">
                {/* True Negative */}
                <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/30">
                  <span className="text-[10px] font-mono-code text-slate-400 uppercase">
                    True Negative (TN)
                  </span>
                  <div className="text-2xl font-bold font-orbitron text-emerald-400 mt-1">
                    {metrics.confusion_matrix[0][0]}
                  </div>
                  <span className="text-[10px] font-mono-code text-emerald-500">
                    Correctly Identified Normal
                  </span>
                </div>

                {/* False Positive */}
                <div className="p-4 rounded-lg bg-amber-950/20 border border-amber-500/30">
                  <span className="text-[10px] font-mono-code text-slate-400 uppercase">
                    False Positive (FP)
                  </span>
                  <div className="text-2xl font-bold font-orbitron text-amber-400 mt-1">
                    {metrics.confusion_matrix[0][1]}
                  </div>
                  <span className="text-[10px] font-mono-code text-amber-500">
                    False Alarms
                  </span>
                </div>

                {/* False Negative */}
                <div className="p-4 rounded-lg bg-red-950/20 border border-red-500/30">
                  <span className="text-[10px] font-mono-code text-slate-400 uppercase">
                    False Negative (FN)
                  </span>
                  <div className="text-2xl font-bold font-orbitron text-red-400 mt-1">
                    {metrics.confusion_matrix[1][0]}
                  </div>
                  <span className="text-[10px] font-mono-code text-red-500">
                    Missed Failure Hazards
                  </span>
                </div>

                {/* True Positive */}
                <div className="p-4 rounded-lg bg-cyan-950/30 border border-cyan-500/40">
                  <span className="text-[10px] font-mono-code text-slate-400 uppercase">
                    True Positive (TP)
                  </span>
                  <div className="text-2xl font-bold font-orbitron text-cyan-300 mt-1">
                    {metrics.confusion_matrix[1][1]}
                  </div>
                  <span className="text-[10px] font-mono-code text-cyan-400">
                    Failures Intercepted
                  </span>
                </div>
              </div>

              <div className="mt-3 text-[11px] font-mono-code text-slate-400 text-center">
                Predicted vs Actual failure classification matrix
              </div>
            </div>
          )}
        </div>

        {/* Feature Importance Bar Chart (7 cols) */}
        <div className="lg:col-span-7 hud-panel p-5 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-xs font-mono-code uppercase font-semibold text-cyan-400 tracking-wider flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4" />
              Gini Impurity Feature Importance Ranking
            </span>
            <span className="text-[10px] font-mono-code text-slate-500">
              Random Forest Trees
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={featureChartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" unit="%" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis dataKey="name" type="category" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0d131f',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`${val}% Weight`, 'Feature Importance']}
                />
                <Bar dataKey="importance" fill="#00f0ff" radius={[0, 4, 4, 0]}>
                  {featureChartData.map((_, index) => (
                    <Cell
                      key={`feat-${index}`}
                      fill={index === 0 ? '#00f0ff' : index === 1 ? '#38bdf8' : '#0284c7'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Model Benchmark Comparison Table */}
      <div className="hud-panel p-5 rounded-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <span className="text-xs font-mono-code uppercase font-semibold text-white tracking-wider">
            Machine Learning Benchmark Comparison (Baseline vs ARMORSENSE)
          </span>
          <span className="text-[10px] font-mono-code text-emerald-400">
            ARMORSENSE Outperforms Baselines
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono-code">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                <th className="pb-2">Algorithm / Classifier</th>
                <th className="pb-2">Accuracy</th>
                <th className="pb-2">Precision</th>
                <th className="pb-2">Recall (Sensitivity)</th>
                <th className="pb-2">F1-Score</th>
                <th className="pb-2">ROC-AUC</th>
                <th className="pb-2">Class Imbalance Handling</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr className="hover:bg-slate-900/40">
                <td className="py-2.5 text-slate-400">Dummy Prior (Majority Vote)</td>
                <td className="py-2.5 text-slate-400">96.6%</td>
                <td className="py-2.5 text-slate-400">0.0%</td>
                <td className="py-2.5 text-slate-400">0.0%</td>
                <td className="py-2.5 text-slate-400">0.0%</td>
                <td className="py-2.5 text-slate-400">0.500</td>
                <td className="py-2.5 text-slate-500">None (Ignores Failures)</td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="py-2.5 text-slate-300">Logistic Regression (L2)</td>
                <td className="py-2.5 text-slate-300">96.9%</td>
                <td className="py-2.5 text-slate-300">62.5%</td>
                <td className="py-2.5 text-slate-300">36.8%</td>
                <td className="py-2.5 text-slate-300">46.3%</td>
                <td className="py-2.5 text-slate-300">0.825</td>
                <td className="py-2.5 text-slate-400">Linear Boundary</td>
              </tr>
              <tr className="bg-cyan-950/20 border-l-2 border-cyan-400">
                <td className="py-2.5 pl-2 text-cyan-300 font-bold">
                  ARMORSENSE Balanced Random Forest
                </td>
                <td className="py-2.5 text-emerald-400 font-bold">
                  {metrics ? `${(metrics.accuracy * 100).toFixed(1)}%` : '98.4%'}
                </td>
                <td className="py-2.5 text-sky-400 font-bold">
                  {metrics ? `${(metrics.precision * 100).toFixed(1)}%` : '79.4%'}
                </td>
                <td className="py-2.5 text-amber-400 font-bold">
                  {metrics ? `${(metrics.recall * 100).toFixed(1)}%` : '82.1%'}
                </td>
                <td className="py-2.5 text-purple-400 font-bold">
                  {metrics ? `${(metrics.f1_score * 100).toFixed(1)}%` : '80.7%'}
                </td>
                <td className="py-2.5 text-emerald-300 font-bold">
                  {metrics ? metrics.roc_auc.toFixed(3) : '0.988'}
                </td>
                <td className="py-2.5 text-cyan-300 font-semibold">
                  Cost-Sensitive Class Weighting
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
