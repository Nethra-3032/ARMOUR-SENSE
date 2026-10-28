import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Plus,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2
} from 'lucide-react';
import { CreateWorkOrderModal } from '../components/CreateWorkOrderModal';
import { apiService } from '../services/api';
import { MaintenanceRecord } from '../types';

export const MaintenancePage: React.FC = () => {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const data = await apiService.getMaintenanceRecords({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
      });
      setRecords(data);
    } catch (err) {
      console.error('Failed to load maintenance records', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [statusFilter, priorityFilter]);

  const handleStatusChange = async (id: number, nextStatus: string) => {
    try {
      await apiService.updateMaintenanceRecord(id, { status: nextStatus });
      loadRecords();
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this work order?')) return;
    try {
      await apiService.deleteMaintenanceRecord(id);
      loadRecords();
    } catch (err: any) {
      alert('Failed to delete work order: ' + err.message);
    }
  };

  const filtered = records.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.asset_id.toLowerCase().includes(q) ||
      r.issue_observed.toLowerCase().includes(q) ||
      r.assigned_technician.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="hud-panel p-4 lg:p-6 rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl lg:text-2xl font-black font-orbitron tracking-wide text-white uppercase">
              Tactical Maintenance & Work Orders
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono-code mt-1">
            Track technician dispatch, repair verification, and closed-loop field maintenance telemetry
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-sky-500 hover:from-cyan-500 hover:to-sky-400 text-white font-mono-code text-xs uppercase font-bold tracking-wider flex items-center gap-2 transition-all shadow-md shadow-cyan-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>DISPATCH NEW WORK ORDER</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="hud-panel p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="relative min-w-[240px] flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Asset ID, Technician, or Issue..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950/80 border border-slate-700 text-xs text-white font-mono-code focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-700 text-xs text-slate-300 font-mono-code focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Under Review">Under Review</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-700 text-xs text-slate-300 font-mono-code focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>

          <button
            onClick={loadRecords}
            className="p-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white transition-colors"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Orders Grid / Cards */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center text-slate-400 text-xs font-mono-code">
          <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mb-2" />
          <span>Loading maintenance work orders...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="hud-panel p-12 text-center rounded-xl border border-slate-800">
          <p className="text-xs font-mono-code text-slate-400">
            No maintenance records found matching the active filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((r) => {
            let priorityBadge = 'bg-slate-800 text-slate-300 border-slate-700';
            if (r.priority === 'Critical') priorityBadge = 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse';
            if (r.priority === 'High') priorityBadge = 'bg-orange-500/20 text-orange-400 border-orange-500/40';
            if (r.priority === 'Medium') priorityBadge = 'bg-amber-500/20 text-amber-400 border-amber-500/40';
            if (r.priority === 'Low') priorityBadge = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';

            let statusBadge = 'bg-slate-800 text-slate-300 border-slate-700';
            if (r.status === 'Completed') statusBadge = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            if (r.status === 'In Progress') statusBadge = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
            if (r.status === 'Under Review') statusBadge = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
            if (r.status === 'Pending') statusBadge = 'bg-slate-800 text-slate-400 border-slate-700';

            return (
              <div
                key={r.id}
                className="hud-panel p-5 rounded-xl border border-slate-800 space-y-3 relative group hover:border-slate-700 transition-all"
              >
                {/* Card Top: Asset ID, Priority & Status */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold font-orbitron text-white">
                        {r.asset_id}
                      </span>
                      <span className={`text-[10px] uppercase font-mono-code font-bold px-2 py-0.5 rounded border ${priorityBadge}`}>
                        {r.priority}
                      </span>
                      <span className={`text-[10px] uppercase font-mono-code font-bold px-2 py-0.5 rounded border ${statusBadge}`}>
                        {r.status}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono-code mt-0.5 block">
                      Ticket #{r.id} • Source: {r.source}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDelete(r.id)}
                    className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors"
                    title="Delete Work Order"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Issue Description */}
                <div>
                  <span className="text-[10px] uppercase font-mono-code text-slate-400">Diagnostic Issue</span>
                  <p className="text-xs text-slate-200 mt-0.5 font-mono-code leading-relaxed">
                    {r.issue_observed}
                  </p>
                </div>

                {/* Action Taken */}
                {r.action_taken && (
                  <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs font-mono-code">
                    <span className="text-[10px] uppercase text-cyan-400 block mb-0.5">Technician Action / Resolution</span>
                    <p className="text-slate-300 text-[11px]">{r.action_taken}</p>
                  </div>
                )}

                {/* Footer: Technician & Quick Status Changer */}
                <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono-code">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{r.assigned_technician}</span>
                  </div>

                  {/* Status Toggle Buttons */}
                  <div className="flex items-center gap-1">
                    {r.status !== 'In Progress' && (
                      <button
                        onClick={() => handleStatusChange(r.id, 'In Progress')}
                        className="px-2 py-1 rounded bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 text-[10px] uppercase transition-colors"
                      >
                        Start Repair
                      </button>
                    )}
                    {r.status !== 'Under Review' && (
                      <button
                        onClick={() => handleStatusChange(r.id, 'Under Review')}
                        className="px-2 py-1 rounded bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 text-amber-300 text-[10px] uppercase transition-colors"
                      >
                        Review
                      </button>
                    )}
                    {r.status !== 'Completed' && (
                      <button
                        onClick={() => handleStatusChange(r.id, 'Completed')}
                        className="px-2 py-1 rounded bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-[10px] uppercase transition-colors"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dispatch Modal */}
      <CreateWorkOrderModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => loadRecords()}
      />
    </div>
  );
};
