import React, { useState } from 'react';
import { X, Send, Wrench, ShieldAlert, CheckCircle, AlertCircle } from 'lucide-react';
import { apiService } from '../services/api';

interface CreateWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialAssetId?: string;
  initialIssue?: string;
  initialPriority?: 'Low' | 'Medium' | 'High' | 'Critical';
}

export const CreateWorkOrderModal: React.FC<CreateWorkOrderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialAssetId = '',
  initialIssue = '',
  initialPriority = 'High',
}) => {
  const [assetId, setAssetId] = useState(initialAssetId || 'M10018');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>(initialPriority);
  const [technician, setTechnician] = useState('Tech. Rajesh Sharma');
  const [issue, setIssue] = useState(initialIssue);
  const [actionTaken, setActionTaken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId.trim() || !issue.trim()) {
      setError('Asset ID and Issue Description are required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await apiService.createMaintenanceRecord({
        asset_id: assetId.trim().toUpperCase(),
        issue_observed: issue.trim(),
        priority,
        assigned_technician: technician,
        action_taken: actionTaken.trim() || 'Awaiting preliminary field inspection.',
        status: 'Pending',
        source: 'Automated AI Telemetry Dispatch',
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to dispatch work order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0b121e] border border-cyan-500/40 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden hud-panel">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-orbitron tracking-wide">
                DISPATCH WORK ORDER
              </h3>
              <p className="text-xs text-slate-400 font-mono-code">
                ARMORSENSE TACTICAL MAINTENANCE DISPATCH
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono-code text-slate-300 uppercase tracking-wider mb-1.5">
                Asset / Vehicle ID
              </label>
              <input
                type="text"
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                placeholder="e.g. M10018"
                className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-700 text-white font-mono-code text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono-code text-slate-300 uppercase tracking-wider mb-1.5">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-700 text-white font-mono-code text-xs focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="Low">Low - Routine</option>
                <option value="Medium">Medium - Warning</option>
                <option value="High">High - Urgent</option>
                <option value="Critical">Critical - Immediate</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono-code text-slate-300 uppercase tracking-wider mb-1.5">
              Assigned Field Technician
            </label>
            <input
              type="text"
              value={technician}
              onChange={(e) => setTechnician(e.target.value)}
              placeholder="e.g. Tech. Rajesh Sharma"
              className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-700 text-white font-mono-code text-xs focus:outline-none focus:border-cyan-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono-code text-slate-300 uppercase tracking-wider mb-1.5">
              Diagnostic Issue / Observed Telemetry
            </label>
            <textarea
              rows={3}
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="Describe telemetry anomaly or predicted failure mode..."
              className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-700 text-white font-mono-code text-xs focus:outline-none focus:border-cyan-500 transition-colors resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono-code text-slate-300 uppercase tracking-wider mb-1.5">
              Initial Action Taken / Recommended Protocol
            </label>
            <textarea
              rows={2}
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              placeholder="Immediate remediation instruction for technician..."
              className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-700 text-white font-mono-code text-xs focus:outline-none focus:border-cyan-500 transition-colors resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono-code text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-sky-500 hover:from-cyan-500 hover:to-sky-400 text-white text-xs font-mono-code font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'DISPATCHING...' : 'DISPATCH TICKET'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
