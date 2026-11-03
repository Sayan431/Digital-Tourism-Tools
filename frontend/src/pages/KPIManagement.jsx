import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Target,
  Upload,
  Plus,
  TrendingUp,
  TrendingDown,
  Calendar,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';

const KPIManagement = () => {
  const { activeOrgId, isSuperAdmin } = useAuth();
  const { showToast } = useToast();

  const [period, setPeriod] = useState('2026-11');
  const [summary, setSummary] = useState(null);
  const [definitions, setDefinitions] = useState([]);
  const [selectedKpi, setSelectedKpi] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [targetForm, setTargetForm] = useState({
    kpi_definition_id: '',
    period_type: 'monthly',
    period_identifier: '2026-11',
    target_value: '',
  });
  const [importFile, setImportFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchKPIData();
  }, [activeOrgId, period]);

  const fetchKPIData = async () => {
    setLoading(true);
    try {
      const params = { period };
      if (activeOrgId) params.org_id = activeOrgId;

      const [sumRes, defsRes] = await Promise.all([
        api.get('/kpis/summary', { params }),
        api.get('/kpis/definitions'),
      ]);

      setSummary(sumRes.data);
      setDefinitions(defsRes.data);
      if (sumRes.data.kpis.length > 0 && !selectedKpi) {
        setSelectedKpi(sumRes.data.kpis[0]);
      }
    } catch (err) {
      console.error('Failed to fetch KPI data', err);
      showToast('Error loading KPI metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSetTarget = async (e) => {
    e.preventDefault();
    try {
      const params = activeOrgId ? { org_id: activeOrgId } : {};
      await api.post(
        '/kpis/targets',
        {
          kpi_definition_id: parseInt(targetForm.kpi_definition_id, 10),
          period_type: targetForm.period_type,
          period_identifier: targetForm.period_identifier,
          target_value: parseFloat(targetForm.target_value),
        },
        { params }
      );
      showToast('KPI target updated successfully', 'success');
      setIsTargetModalOpen(false);
      fetchKPIData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to update target', 'error');
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!importFile) {
      showToast('Please select a CSV or Excel file', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', importFile);
    setIsUploading(true);

    try {
      const params = activeOrgId ? { org_id: activeOrgId } : {};
      const res = await api.post('/kpis/import', formData, {
        params,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast(res.data.message || 'Dataset imported successfully', 'success');
      setIsImportModalOpen(false);
      setImportFile(null);
      fetchKPIData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'File import failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const formatUnit = (val, unit) => {
    if (val === null || val === undefined) return 'N/A';
    if (unit === 'currency') return `$${Number(val).toLocaleString()}`;
    if (unit === 'percentage') return `${val}%`;
    if (unit === 'score') return `${Number(val).toFixed(1)} / 5.0`;
    return Number(val).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            KPI Collection, Targets & Visualization
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated KPI tracking from live operations, historical records, and target benchmarks.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Period selector */}
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent focus:outline-hidden cursor-pointer"
            >
              <option value="2026-11">November 2026</option>
              <option value="2026-10">October 2026</option>
              <option value="2026-09">September 2026</option>
              <option value="2026-08">August 2026</option>
            </select>
          </div>

          {/* Import dataset button */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-[#2376A8]" />
            Import CSV/Excel
          </button>

          {/* Set target button */}
          <button
            onClick={() => {
              if (definitions.length > 0) {
                setTargetForm((prev) => ({
                  ...prev,
                  kpi_definition_id: definitions[0].id,
                }));
              }
              setIsTargetModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#142B45] to-[#2376A8] hover:opacity-95 text-white text-xs font-semibold shadow-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Set Target
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(summary?.kpis || []).map((kpi) => {
          const isSelected = selectedKpi?.code === kpi.code;
          return (
            <div
              key={kpi.code}
              onClick={() => setSelectedKpi(kpi)}
              className={`p-5 rounded-2xl bg-white border cursor-pointer transition-all duration-200 hover:shadow-md ${
                isSelected
                  ? 'border-[#2376A8] ring-2 ring-[#2376A8]/20 shadow-md'
                  : 'border-slate-200/80 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {kpi.category}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    kpi.status === 'on_track'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : kpi.status === 'warning'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {kpi.status === 'on_track'
                    ? 'On Track'
                    : kpi.status === 'warning'
                    ? 'Warning'
                    : 'Behind'}
                </span>
              </div>

              <h3 className="text-xs font-bold text-slate-800 line-clamp-1 mb-1">
                {kpi.name}
              </h3>

              <div className="text-xl font-bold text-slate-900 tracking-tight">
                {formatUnit(kpi.current_value, kpi.unit)}
              </div>

              {/* Target comparison bar */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Target:{' '}
                  <strong className="text-slate-800">
                    {kpi.target_value ? formatUnit(kpi.target_value, kpi.unit) : 'Not set'}
                  </strong>
                </span>
                {kpi.achievement_rate !== null && (
                  <span
                    className={`font-semibold ${
                      kpi.achievement_rate >= 95 ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {kpi.achievement_rate}% achieved
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected KPI Deep Dive Chart & History */}
      {selectedKpi && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Historical Trend Chart (2 Cols) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedKpi.name} &bull; Historical Performance vs Target
                </h3>
                <p className="text-xs text-slate-500">
                  Monthly progression across operating periods
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                Unit: {selectedKpi.unit.toUpperCase()}
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={selectedKpi.historical || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar
                    dataKey="actual"
                    name="Actual Performance"
                    fill="#142B45"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="target"
                    name="Target Benchmark"
                    fill="#27A69A"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Historical Table Log (1 Col) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Period Audit Log
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Recorded historical entries for {selectedKpi.name}
              </p>

              <div className="overflow-y-auto max-h-72 divide-y divide-slate-100">
                {(selectedKpi.historical || []).map((row, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-800 block">
                        {row.period}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Target: {row.target ? formatUnit(row.target, selectedKpi.unit) : 'N/A'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 block">
                        {formatUnit(row.actual, selectedKpi.unit)}
                      </span>
                      {row.growth !== null && (
                        <span className="text-[10px] font-semibold text-emerald-600">
                          +{row.growth}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> Auto-computed from DB
              </span>
              <span>Total records: {selectedKpi.historical?.length || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Target Setup Modal */}
      <Modal
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
        title="Configure Performance Target Benchmark"
      >
        <form onSubmit={handleSetTarget} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select KPI
            </label>
            <select
              required
              value={targetForm.kpi_definition_id}
              onChange={(e) =>
                setTargetForm({ ...targetForm, kpi_definition_id: e.target.value })
              }
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl"
            >
              {definitions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.category})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Period Type
              </label>
              <select
                value={targetForm.period_type}
                onChange={(e) =>
                  setTargetForm({ ...targetForm, period_type: e.target.value })
                }
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Period Identifier
              </label>
              <input
                type="text"
                required
                placeholder="2026-11"
                value={targetForm.period_identifier}
                onChange={(e) =>
                  setTargetForm({ ...targetForm, period_identifier: e.target.value })
                }
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Value
            </label>
            <input
              type="number"
              step="any"
              required
              placeholder="e.g. 35000"
              value={targetForm.target_value}
              onChange={(e) =>
                setTargetForm({ ...targetForm, target_value: e.target.value })
              }
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsTargetModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#142B45] text-white text-xs font-semibold hover:bg-[#1b3a5d]"
            >
              Save Target
            </button>
          </div>
        </form>
      </Modal>

      {/* Import Dataset Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Upload KPI or External Performance Dataset"
      >
        <form onSubmit={handleFileUpload} className="space-y-4">
          <p className="text-xs text-slate-500">
            Upload CSV or Excel files containing external or historical performance records. Expected columns:
            <code className="block bg-slate-100 p-2 rounded-lg mt-1 text-slate-700 font-mono text-[11px]">
              kpi_code, period_date, period_label, actual_value, target_value, growth_rate, notes
            </code>
          </p>

          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-[#2376A8] transition-colors">
            <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <input
              type="file"
              accept=".csv, .xlsx, .xls"
              onChange={(e) => setImportFile(e.target.files[0])}
              className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-[#2376A8] hover:file:bg-sky-100 cursor-pointer"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !importFile}
              className="px-4 py-2 rounded-xl bg-[#2376A8] text-white text-xs font-semibold hover:bg-[#1b5f87] disabled:opacity-50"
            >
              {isUploading ? 'Uploading...' : 'Process Dataset'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default KPIManagement;

