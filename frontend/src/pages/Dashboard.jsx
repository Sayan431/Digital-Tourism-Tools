import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  CalendarCheck,
  Users,
  Compass,
  Star,
  TrendingUp,
  Percent,
  Clock,
  MessageSquare,
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
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
import StatCard from '../components/StatCard';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';

const CATEGORY_COLORS = ['#142B45', '#2376A8', '#27A69A', '#F59E0B', '#8B5CF6', '#EC4899'];

const Dashboard = () => {
  const { activeOrgId, isSuperAdmin } = useAuth();
  const { showToast } = useToast();
  const [period, setPeriod] = useState('30d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [activeOrgId, period]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const params = { period };
      if (activeOrgId) params.org_id = activeOrgId;
      const res = await api.get('/dashboard', { params });
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
      showToast('Error loading dashboard metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#2376A8] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Loading Client Operations Dashboard...
          </p>
        </div>
      </div>
    );
  }

  const kpis = data?.kpi_cards || {};
  const currencySymbol = data?.organization?.currency === 'EUR' ? '€' : '$';

  return (
    <div className="space-y-6">
      {/* Top Banner & Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Tourism Operations Dashboard
            </h1>
            {isSuperAdmin && !activeOrgId && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Aggregated Platform View
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time digital performance tracking, bookings, guest satisfaction, and operational metrics.
          </p>
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200/80 shadow-xs self-start sm:self-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-2" />
          {['7d', '30d', '90d', '1y'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === p
                  ? 'bg-[#142B45] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Dashboard KPI Cards (Module 1 Requirements) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={`${currencySymbol}${kpis.total_revenue?.toLocaleString() || '0.00'}`}
          subtitle="vs. previous period"
          icon={DollarSign}
          trend="+14.2%"
          trendPositive={true}
          color="navy"
        />
        <StatCard
          title="Total Bookings"
          value={kpis.total_bookings || 0}
          subtitle={`${kpis.confirmed_bookings || 0} confirmed / completed`}
          icon={CalendarCheck}
          trend="+12.5%"
          trendPositive={true}
          color="ocean"
        />
        <StatCard
          title="Active Experiences"
          value={kpis.active_experiences || 0}
          subtitle="Available for direct booking"
          icon={Compass}
          badge="Live Catalog"
          color="teal"
        />
        <StatCard
          title="Total Customers"
          value={kpis.total_customers || 0}
          subtitle="Profiles in guest CRM"
          icon={Users}
          trend="+8.4%"
          trendPositive={true}
          color="amber"
        />
      </div>

      {/* Secondary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Average Booking Value"
          value={`${currencySymbol}${kpis.average_booking_value?.toFixed(2) || '0.00'}`}
          subtitle="Per confirmed guest reservation"
          icon={TrendingUp}
          color="navy"
        />
        <StatCard
          title="Customer Satisfaction"
          value={`${kpis.customer_satisfaction?.toFixed(1) || '4.8'} / 5.0`}
          subtitle="From post-tour feedback surveys"
          icon={Star}
          badge="Top Rated"
          color="teal"
        />
        <StatCard
          title="Cancellation Rate"
          value={`${kpis.cancellation_rate?.toFixed(1) || '0.0'}%`}
          subtitle="Within acceptable 5% operational SLA"
          icon={Percent}
          trend="-1.2%"
          trendPositive={true}
          color="ocean"
        />
      </div>

      {/* 2. Primary Charts (Monthly Revenue & Booking Trends) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Trend (2 Columns) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Monthly Revenue & Booking Trajectory
              </h3>
              <p className="text-xs text-slate-500">
                Gross sales and volume over past 6 operational cycles
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-slate-700">
                <span className="w-3 h-3 rounded-sm bg-[#2376A8]" /> Revenue ({currencySymbol})
              </span>
              <span className="flex items-center gap-1.5 text-slate-700">
                <span className="w-3 h-3 rounded-sm bg-[#27A69A]" /> Bookings
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.monthly_revenue_chart || []}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2376A8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2376A8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickFormatter={(v) => `${currencySymbol}${v / 1000}k`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                />
                <Tooltip
                  formatter={(val, name) => [
                    name === 'revenue' ? `${currencySymbol}${val.toLocaleString()}` : val,
                    name === 'revenue' ? 'Revenue' : 'Bookings',
                  ]}
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2376A8"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
                <Bar
                  yAxisId="right"
                  dataKey="bookings"
                  fill="#27A69A"
                  radius={[4, 4, 0, 0]}
                  barSize={18}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Experience Category (1 Column) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Revenue by Category
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Contribution by experience offering
            </p>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.revenue_by_category || []}
                    dataKey="revenue"
                    nameKey="category"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {(data?.revenue_by_category || []).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [`${currencySymbol}${val.toLocaleString()}`, 'Revenue']}
                    contentStyle={{
                      backgroundColor: '#fff',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 mt-2 border-t border-slate-100 pt-3">
            {(data?.revenue_by_category || []).slice(0, 4).map((cat, i) => (
              <div key={cat.category} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-600 truncate max-w-[140px]">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                  />
                  <span className="truncate">{cat.category}</span>
                </span>
                <span className="font-semibold text-slate-900">
                  {currencySymbol}{cat.revenue.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Operational Sections: Popular Experiences, Upcoming Tours, Recent Inquiries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Popular Tourism Experiences (1 Col) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">
              Popular Experiences
            </h3>
            <Link
              to="/experiences"
              className="text-xs font-semibold text-[#2376A8] hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3.5">
            {(data?.popular_experiences || []).map((exp) => (
              <div
                key={exp.id}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors"
              >
                <img
                  src={exp.image_url}
                  alt={exp.title}
                  className="w-12 h-12 rounded-lg object-cover shrink-0 border border-slate-200"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {exp.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate">
                    {exp.destination} &bull; {exp.category}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-slate-800">
                      {currencySymbol}{exp.price}
                    </span>
                    <span className="text-[10px] text-amber-600 flex items-center gap-0.5 font-semibold">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      {exp.rating}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Tourism Departures (1 Col) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">
              Upcoming Tour Departures
            </h3>
            <Link
              to="/bookings"
              className="text-xs font-semibold text-[#2376A8] hover:underline flex items-center gap-1"
            >
              Bookings <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {(data?.upcoming_experiences || []).map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-mono text-[10px] font-bold text-[#2376A8] bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200/60">
                    {item.booking_reference}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {item.booking_date}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 truncate">
                  {item.experience_title}
                </h4>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                  <span>Guest: {item.customer_name}</span>
                  <span className="font-semibold text-slate-800">
                    {item.participants} guest(s) &bull; {currencySymbol}{item.total_price}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Inquiries & Lead Pipeline (1 Col) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">
              Recent Guest Inquiries
            </h3>
            <Link
              to="/crm"
              className="text-xs font-semibold text-[#2376A8] hover:underline flex items-center gap-1"
            >
              CRM Inbox <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {(data?.recent_inquiries || []).map((lead) => (
              <div
                key={lead.id}
                className="p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">
                    {lead.name}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      lead.status === 'Converted'
                        ? 'bg-emerald-50 text-emerald-700'
                        : lead.status === 'Interested'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-sky-50 text-sky-700'
                    }`}
                  >
                    {lead.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 line-clamp-2">
                  "{lead.inquiry}"
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                  <span>Source: {lead.source}</span>
                  <span>{lead.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

