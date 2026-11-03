import React, { useState, useEffect } from 'react';
import {
  GitFork,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Zap,
  ArrowRight,
  FileCheck,
  Send,
  HelpCircle,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Workflows = () => {
  const { activeOrgId } = useAuth();
  const { showToast } = useToast();

  const [workflows, setWorkflows] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggeringId, setTriggeringId] = useState(null);

  useEffect(() => {
    fetchWorkflowsData();
  }, [activeOrgId]);

  const fetchWorkflowsData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeOrgId) params.org_id = activeOrgId;

      const [wfRes, execRes] = await Promise.all([
        api.get('/workflows', { params }),
        api.get('/workflows/executions', { params: { ...params, limit: 20 } }),
      ]);

      setWorkflows(wfRes.data);
      setExecutions(execRes.data);
    } catch (err) {
      console.error('Failed to load workflows', err);
      showToast('Error loading automated workflows', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWorkflow = async (workflow) => {
    try {
      const params = activeOrgId ? { org_id: activeOrgId } : {};
      const updatedStatus = !workflow.is_enabled;
      await api.put(
        `/workflows/${workflow.id}`,
        { is_enabled: updatedStatus },
        { params }
      );
      setWorkflows((prev) =>
        prev.map((w) =>
          w.id === workflow.id ? { ...w, is_enabled: updatedStatus } : w
        )
      );
      showToast(
        `Workflow '${workflow.name}' is now ${updatedStatus ? 'Enabled' : 'Disabled'}`,
        'success'
      );
    } catch (err) {
      showToast('Failed to toggle workflow status', 'error');
    }
  };

  const handleManualTrigger = async (workflowId) => {
    setTriggeringId(workflowId);
    try {
      const params = activeOrgId ? { org_id: activeOrgId } : {};
      const res = await api.post(
        '/workflows/trigger',
        { workflow_id: workflowId },
        { params }
      );
      showToast(res.data.result?.message || 'Workflow executed successfully', 'success');
      fetchWorkflowsData();
    } catch (err) {
      showToast('Manual trigger failed', 'error');
    } finally {
      setTriggeringId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Client Workflow Automation Engine
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time event-driven triggers for inquiries, bookings, operational reminders, and guest feedback.
          </p>
        </div>

        <button
          onClick={fetchWorkflowsData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          Refresh Engine Logs
        </button>
      </div>

      {/* 5 Core Demonstration Workflows List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workflows.map((wf) => (
          <div
            key={wf.id}
            className={`p-6 rounded-2xl bg-white border transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between ${
              wf.is_enabled ? 'border-slate-200/80' : 'border-slate-200/50 opacity-75'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-sky-50 text-[#2376A8] border border-sky-200/60 uppercase">
                  Trigger: {wf.trigger_event}
                </span>

                <button
                  onClick={() => handleToggleWorkflow(wf)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                  title={wf.is_enabled ? 'Disable workflow' : 'Enable workflow'}
                >
                  {wf.is_enabled ? (
                    <ToggleRight className="w-7 h-7 text-[#27A69A]" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-slate-300" />
                  )}
                </button>
              </div>

              <h3 className="text-sm font-bold text-slate-900 mb-1.5">{wf.name}</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                {wf.description}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="text-[11px] text-slate-400">
                <span>Runs: <strong className="text-slate-700 font-bold">{wf.execution_count}</strong></span>
              </div>

              <button
                onClick={() => handleManualTrigger(wf.id)}
                disabled={triggeringId === wf.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#2376A8] hover:text-white text-slate-700 text-xs font-semibold transition-all disabled:opacity-50"
              >
                {triggeringId === wf.id ? (
                  <span className="w-3.5 h-3.5 border-2 border-[#2376A8] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                <span>Test Trigger</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Execution Audit Log Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Workflow Execution History & Event Log
            </h3>
            <p className="text-xs text-slate-500">
              Real-time audit log of automated system events and simulated dispatches
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Engine Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Workflow Name</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Execution Message / Outcome</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {executions.map((ex) => (
                <tr key={ex.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {ex.workflow_name || 'Automated Action'}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ex.status === 'SUCCESS'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {ex.status === 'SUCCESS' ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-rose-600" />
                      )}
                      {ex.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-md truncate">
                    {ex.execution_message}
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-right font-mono text-[11px]">
                    {new Date(ex.executed_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Workflows;

