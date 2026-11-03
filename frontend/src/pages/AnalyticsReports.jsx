import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Download,
  Calendar,
  TrendingUp,
  BarChart3,
  Users,
  Compass,
  PieChart as PieIcon,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';

const REPORT_TYPES = [
  'Monthly Performance Report',
  'Revenue Analytics Report',
  'Booking Operations Report',
  'Customer Portfolio Report',
  'Tourism Experience Performance Report',
  'KPI Performance Target Report',
];

const PIE_COLORS = ['#142B45', '#27A69A', '#2376A8', '#F59E0B'];

const AnalyticsReports = () => {
  const { activeOrgId } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' or 'reports'
  const [analyticsData, setAnalyticsData] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Generate Report Modal
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportForm, setReportForm] = useState({
    title: 'Monthly Operations & Performance Audit',
    report_type: 'Monthly Performance Report',
    period_start: '2026-10-01',
    period_end: '2026-10-31',
    file_format: 'PDF',
  });

  useEffect(() => {
    fetchAnalyticsAndReports();
  }, [activeOrgId, activeTab]);

  const fetchAnalyticsAndReports = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeOrgId) params.org_id = activeOrgId;

      if (activeTab === 'analytics') {
        const res = await api.get('/analytics/overview', { params });
        setAnalyticsData(res.data);
      } else {
        const res = await api.get('/reports', { params });
        setReports(res.data);
      }
    } catch (err) {
      console.error('Failed to load analytics and reporting data', err);
      showToast('Error loading analytics and reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const params = activeOrgId ? { org_id: activeOrgId } : {};
      const res = await api.post('/reports/generate', reportForm, { params });
      showToast('Report generated successfully! Ready for download.', 'success');
      setIsGenerateModalOpen(false);
      setActiveTab('reports');
      fetchAnalyticsAndReports();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Report generation failed', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadReport = async (report) => {
    try {
      const token = localStorage.getItem('token');
      // Request binary blob with auth headers
      const res = await api.get(`/reports/download/${report.id}`, {
        responseType: 'blob',
      });

      const blob = new Blob([res.data], {
        type:
          report.file_format === 'PDF'
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.title.replace(/\s+/g, '_')}.${report.file_format.toLowerCase() === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showToast(`Downloaded ${report.title} (${report.file_format})`, 'success');
    } catch (err) {
      console.error('Download failed', err);
      showToast('Failed to download report file', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Performance Analytics & Automated Reporting
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Deep-dive operational metrics, revenue analytics, and on-demand PDF / Excel report exports.
          </p>
        </div>

        <button
          onClick={() => setIsGenerateModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#142B45] to-[#2376A8] hover:opacity-95 text-white text-xs font-semibold shadow-xs transition-all self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Generate New Report
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200/80 shadow-xs max-w-sm">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'analytics'
              ? 'bg-[#142B45] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Analytics & Insights
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'reports'
              ? 'bg-[#142B45] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Generated Reports ({reports.length})
        </button>
      </div>

      {/* Analytics Tab Content */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Top Charts: Revenue Margin & Booking Status Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend vs Target */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Gross Revenue Trend vs Operating Target
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Monthly revenue variance analysis
              </p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData?.revenue_trend || []}>
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
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      name="Actual Revenue ($)"
                      stroke="#142B45"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="target"
                      name="Revenue Target ($)"
                      stroke="#27A69A"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Booking Operations Status Trends */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Booking Operations Trend by Month
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Confirmed vs completed vs cancelled reservations
              </p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData?.booking_trend || []}>
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
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="confirmed" name="Confirmed" fill="#2376A8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completed" name="Completed" fill="#27A69A" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cancelled" name="Cancelled" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Customer & Experience Analytics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* New vs Returning Customers */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Customer Portfolio Composition
                </h3>
                <p className="text-xs text-slate-500 mb-4">New first-time vs returning guests</p>

                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData?.customer_composition || []}
                        dataKey="count"
                        nameKey="type"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={5}
                      >
                        {(analyticsData?.customer_composition || []).map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-slate-100">
                {(analyticsData?.customer_composition || []).map((item, idx) => (
                  <div key={item.type} className="flex justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                      />
                      {item.type}
                    </span>
                    <strong className="text-slate-900">{item.count} guests</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Experience Performance & Occupancy Table (2 Cols) */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Experience Performance & Capacity Utilization
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Occupancy rate and revenue by experience catalog item
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Tour Offering</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Bookings</th>
                      <th className="py-2.5 px-3">Occupancy</th>
                      <th className="py-2.5 px-3 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(analyticsData?.experience_performance || []).slice(0, 6).map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-900 truncate max-w-[200px]">
                          {exp.title}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{exp.category}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-700">
                          {exp.bookings_count}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#27A69A]"
                                style={{ width: `${exp.occupancy_rate}%` }}
                              />
                            </div>
                            <span className="font-semibold text-slate-700">
                              {exp.occupancy_rate}%
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          ${exp.revenue?.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reports Tab Content */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Generated Executive Reports Directory
              </h3>
              <p className="text-xs text-slate-500">
                Click download to retrieve styled publication-ready PDF or formatted multi-sheet Excel workbooks
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Report Title</th>
                  <th className="py-3 px-4">Report Type</th>
                  <th className="py-3 px-4">Reporting Period</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">Generated By</th>
                  <th className="py-3 px-4 text-right">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {r.file_format === 'PDF' ? (
                          <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                        ) : (
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                        <span className="font-bold text-slate-900">{r.title}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{r.report_type}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {r.period_start} to {r.period_end}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          r.file_format === 'PDF'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {r.file_format}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{r.generated_by}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDownloadReport(r)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#2376A8] hover:text-white text-slate-700 text-xs font-semibold transition-all shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generate Report Modal */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="Generate Automated Performance Report"
      >
        <form onSubmit={handleGenerateReport} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Report Title
            </label>
            <input
              type="text"
              required
              value={reportForm.title}
              onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Report Category
            </label>
            <select
              value={reportForm.report_type}
              onChange={(e) => setReportForm({ ...reportForm, report_type: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            >
              {REPORT_TYPES.map((rt) => (
                <option key={rt} value={rt}>
                  {rt}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Period Start
              </label>
              <input
                type="date"
                required
                value={reportForm.period_start}
                onChange={(e) => setReportForm({ ...reportForm, period_start: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Period End
              </label>
              <input
                type="date"
                required
                value={reportForm.period_end}
                onChange={(e) => setReportForm({ ...reportForm, period_end: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Output Export Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-xl border text-center cursor-pointer transition-all flex items-center justify-center gap-2 text-xs font-bold ${
                  reportForm.file_format === 'PDF'
                    ? 'border-rose-500 bg-rose-50/50 text-rose-900 ring-2 ring-rose-500/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="format"
                  value="PDF"
                  checked={reportForm.file_format === 'PDF'}
                  onChange={() => setReportForm({ ...reportForm, file_format: 'PDF' })}
                  className="hidden"
                />
                <FileText className="w-4 h-4 text-rose-600" />
                PDF Document (ReportLab)
              </label>

              <label
                className={`p-3 rounded-xl border text-center cursor-pointer transition-all flex items-center justify-center gap-2 text-xs font-bold ${
                  reportForm.file_format === 'EXCEL'
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="format"
                  value="EXCEL"
                  checked={reportForm.file_format === 'EXCEL'}
                  onChange={() => setReportForm({ ...reportForm, file_format: 'EXCEL' })}
                  className="hidden"
                />
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Excel Workbook (.xlsx)
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsGenerateModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="px-4 py-2 rounded-xl bg-[#142B45] text-white text-xs font-semibold disabled:opacity-50"
            >
              {isGenerating ? 'Compiling Report...' : 'Compile & Save Report'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AnalyticsReports;

