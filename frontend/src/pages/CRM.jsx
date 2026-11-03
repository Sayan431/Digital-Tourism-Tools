import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  Globe,
  MessageSquare,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Clock,
  Star,
  DollarSign,
  Upload,
  ArrowRight,
  Send,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';

const LEAD_STATUSES = ['New', 'Contacted', 'Interested', 'Converted', 'Lost'];
const LEAD_SOURCES = [
  'Website Inquiry',
  'Travel Agent Referral',
  'Social Media',
  'Partner Campaign',
  'Phone / Direct',
];

const CRM = () => {
  const { activeOrgId } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('customers'); // 'customers' or 'leads'
  const [customers, setCustomers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Selected customer for Profile 360 Drawer
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerBookings, setCustomerBookings] = useState([]);
  const [customerInteractions, setCustomerInteractions] = useState([]);
  const [interactionLoading, setInteractionLoading] = useState(false);

  // New interaction form inside drawer
  const [interactionForm, setInteractionForm] = useState({
    interaction_type: 'Call',
    subject: '',
    notes: '',
    outcome: '',
  });

  // Customer Modal Form
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerForm, setCustomerForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    country: 'United States',
    customer_type: 'new',
    internal_notes: '',
  });

  // Lead Modal Form
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [leadForm, setLeadForm] = useState({
    name: '',
    email: '',
    phone: '',
    inquiry_text: '',
    source: 'Website Inquiry',
    status: 'New',
    estimated_value: '',
  });

  // Customer Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeOrgId, activeTab, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeOrgId) params.org_id = activeOrgId;
      if (search) params.search = search;

      if (activeTab === 'customers') {
        const res = await api.get('/customers', { params });
        setCustomers(res.data);
      } else {
        if (statusFilter) params.status = statusFilter;
        const res = await api.get('/leads', { params });
        setLeads(res.data);
      }
    } catch (err) {
      console.error('Failed to load CRM data', err);
      showToast('Error loading CRM records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCustomer360 = async (cust) => {
    setSelectedCustomer(cust);
    setInteractionLoading(true);
    try {
      const [bRes, iRes] = await Promise.all([
        api.get(`/customers/${cust.id}/bookings`),
        api.get(`/customers/${cust.id}/interactions`),
      ]);
      setCustomerBookings(bRes.data);
      setCustomerInteractions(iRes.data);
    } catch (err) {
      console.error('Failed to load customer profile details', err);
    } finally {
      setInteractionLoading(false);
    }
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    try {
      const params = activeOrgId ? { org_id: activeOrgId } : {};
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, customerForm, { params });
        showToast('Customer record updated', 'success');
      } else {
        await api.post('/customers', customerForm, { params });
        showToast('New customer added to CRM', 'success');
      }
      setIsCustomerModalOpen(false);
      setEditingCustomer(null);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to save customer', 'error');
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer record?')) return;
    try {
      const params = activeOrgId ? { org_id: activeOrgId } : {};
      await api.delete(`/customers/${id}`, { params });
      showToast('Customer deleted successfully', 'success');
      if (selectedCustomer?.id === id) setSelectedCustomer(null);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to delete customer', 'error');
    }
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    try {
      const params = activeOrgId ? { org_id: activeOrgId } : {};
      await api.post(
        '/leads',
        {
          ...leadForm,
          estimated_value: parseFloat(leadForm.estimated_value || 0),
        },
        { params }
      );
      showToast('Inquiry lead created & automated workflow triggered', 'success');
      setIsLeadModalOpen(false);
      setLeadForm({
        name: '',
        email: '',
        phone: '',
        inquiry_text: '',
        source: 'Website Inquiry',
        status: 'New',
        estimated_value: '',
      });
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to create lead', 'error');
    }
  };

  const handleUpdateLeadStatus = async (leadId, newStatus) => {
    try {
      const params = activeOrgId ? { org_id: activeOrgId } : {};
      await api.put(`/leads/${leadId}`, { status: newStatus }, { params });
      showToast(`Lead status updated to ${newStatus}`, 'success');
      fetchData();
    } catch (err) {
      showToast('Failed to update lead status', 'error');
    }
  };

  const handleAddInteraction = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    try {
      const params = activeOrgId ? { org_id: activeOrgId } : {};
      const res = await api.post(
        '/interactions',
        {
          customer_id: selectedCustomer.id,
          ...interactionForm,
        },
        { params }
      );
      setCustomerInteractions([res.data, ...customerInteractions]);
      setInteractionForm({
        interaction_type: 'Call',
        subject: '',
        notes: '',
        outcome: '',
      });
      showToast('Interaction logged to customer profile', 'success');
    } catch (err) {
      showToast('Failed to log interaction', 'error');
    }
  };

  const handleImportCustomers = async (e) => {
    e.preventDefault();
    if (!importFile) return;
    const formData = new FormData();
    formData.append('file', importFile);
    setIsImporting(true);
    try {
      const params = activeOrgId ? { org_id: activeOrgId } : {};
      const res = await api.post('/customers/import', formData, {
        params,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast(res.data.message || 'Customers imported', 'success');
      setIsImportModalOpen(false);
      setImportFile(null);
      fetchData();
    } catch (err) {
      showToast('Customer import failed', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Client CRM & Guest Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage customer 360 profiles, booking history, interaction logs, and digital inquiries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'customers' ? (
            <>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-[#2376A8]" />
                Import Guests
              </button>
              <button
                onClick={() => {
                  setEditingCustomer(null);
                  setCustomerForm({
                    first_name: '',
                    last_name: '',
                    email: '',
                    phone: '',
                    country: 'United States',
                    customer_type: 'new',
                    internal_notes: '',
                  });
                  setIsCustomerModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#142B45] to-[#2376A8] hover:opacity-95 text-white text-xs font-semibold shadow-xs transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Customer
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsLeadModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#142B45] to-[#2376A8] hover:opacity-95 text-white text-xs font-semibold shadow-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              New Inquiry
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'customers'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Customer Profiles ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab('leads')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'leads'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Inquiries & Leads ({leads.length})
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {activeTab === 'leads' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 cursor-pointer"
            >
              <option value="">All Lead Statuses</option>
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}

          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={activeTab === 'customers' ? 'Search customers...' : 'Search leads...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchData()}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#2376A8]/20"
            />
          </div>
        </div>
      </div>

      {/* Main Content: Customers Table OR Leads Pipeline */}
      {activeTab === 'customers' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Guest Name</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Country</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Lifetime Spend</th>
                  <th className="py-3 px-4">Satisfaction</th>
                  <th className="py-3 px-4">Bookings</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((cust) => (
                  <tr
                    key={cust.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => handleOpenCustomer360(cust)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#142B45]/10 text-[#142B45] font-bold flex items-center justify-center text-xs shrink-0">
                          {cust.first_name[0]}
                          {cust.last_name[0]}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block group-hover:text-[#2376A8]">
                            {cust.full_name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Registered {new Date(cust.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="block text-slate-800">{cust.email}</span>
                      <span className="text-[10px] text-slate-400">{cust.phone || 'No phone'}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{cust.country}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          cust.customer_type === 'vip'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : cust.customer_type === 'returning'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {cust.customer_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ${cust.lifetime_spend?.toLocaleString() || '0.00'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        {cust.satisfaction_score?.toFixed(1) || '5.0'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-700">
                        {cust.total_bookings} tour(s)
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenCustomer360(cust)}
                          className="p-1.5 text-slate-400 hover:text-[#2376A8] hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Customer 360"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingCustomer(cust);
                            setCustomerForm({
                              first_name: cust.first_name,
                              last_name: cust.last_name,
                              email: cust.email,
                              phone: cust.phone || '',
                              country: cust.country,
                              customer_type: cust.customer_type,
                              internal_notes: cust.internal_notes || '',
                            });
                            setIsCustomerModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Customer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(cust.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Leads Pipeline Grid */
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {LEAD_STATUSES.map((statusName) => {
            const statusLeads = leads.filter((l) => l.status === statusName);
            return (
              <div
                key={statusName}
                className="bg-slate-100/60 rounded-2xl p-3 border border-slate-200/60 flex flex-col min-h-[450px]"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 text-xs font-bold text-slate-700">
                  <span>{statusName}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-slate-500 font-mono">
                    {statusLeads.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {statusLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all text-xs"
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="font-bold text-slate-900 truncate">
                          {lead.name}
                        </span>
                        <span className="text-[9px] font-bold text-[#2376A8] bg-sky-50 px-1.5 py-0.5 rounded-md shrink-0">
                          ${lead.estimated_value?.toLocaleString() || 0}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 line-clamp-2 mb-2">
                        "{lead.inquiry_text}"
                      </p>

                      <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-2 flex items-center justify-between">
                        <span>{lead.source}</span>
                        <select
                          value={lead.status}
                          onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-md text-[10px] py-0.5 px-1 cursor-pointer"
                        >
                          {LEAD_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              Move to: {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Customer 360 Drawer / Modal */}
      <Modal
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title={selectedCustomer ? `Guest 360 Profile: ${selectedCustomer.full_name}` : ''}
        maxWidth="max-w-3xl"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            {/* Top Stat Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Email & Phone
                </span>
                <span className="text-xs font-semibold text-slate-800 block truncate">
                  {selectedCustomer.email}
                </span>
                <span className="text-[11px] text-slate-500">{selectedCustomer.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Country & Type
                </span>
                <span className="text-xs font-semibold text-slate-800 block">
                  {selectedCustomer.country}
                </span>
                <span className="text-[10px] font-bold text-sky-700 uppercase">
                  {selectedCustomer.customer_type}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Lifetime Value
                </span>
                <span className="text-sm font-bold text-slate-900 block">
                  ${selectedCustomer.lifetime_spend?.toLocaleString() || '0.00'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {customerBookings.length} total booking(s)
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Satisfaction Score
                </span>
                <span className="text-sm font-bold text-amber-600 flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  {selectedCustomer.satisfaction_score?.toFixed(1) || '5.0'} / 5.0
                </span>
              </div>
            </div>

            {/* Internal Notes */}
            {selectedCustomer.internal_notes && (
              <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl text-xs text-amber-900">
                <strong className="font-semibold block mb-0.5">Staff Internal Notes:</strong>
                {selectedCustomer.internal_notes}
              </div>
            )}

            {/* Booking History */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Booking History ({customerBookings.length})
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {customerBookings.length === 0 ? (
                  <p className="text-xs text-slate-400">No bookings recorded yet.</p>
                ) : (
                  customerBookings.map((b) => (
                    <div
                      key={b.id}
                      className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-mono text-[10px] font-bold text-[#2376A8] mr-2">
                          {b.booking_reference}
                        </span>
                        <strong className="text-slate-900">{b.experience_title}</strong>
                        <span className="text-slate-500 block text-[11px]">
                          Date: {b.booking_date} &bull; {b.participants_count} guests
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 block">
                          ${b.total_price?.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-600">
                          {b.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Customer Interaction History & Log New Interaction */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Interaction History & Logs
              </h4>

              {/* Log Form */}
              <form onSubmit={handleAddInteraction} className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={interactionForm.interaction_type}
                    onChange={(e) =>
                      setInteractionForm({ ...interactionForm, interaction_type: e.target.value })
                    }
                    className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                  >
                    <option value="Call">Phone Call</option>
                    <option value="Email">Email Communication</option>
                    <option value="Meeting">Virtual / In-Person Meeting</option>
                    <option value="Feedback">Post-Tour Feedback</option>
                    <option value="Support">Support Ticket</option>
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="Subject (e.g. Dietary Preferences Check)"
                    value={interactionForm.subject}
                    onChange={(e) =>
                      setInteractionForm({ ...interactionForm, subject: e.target.value })
                    }
                    className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <textarea
                  required
                  rows={2}
                  placeholder="Interaction notes and agreed action items..."
                  value={interactionForm.notes}
                  onChange={(e) =>
                    setInteractionForm({ ...interactionForm, notes: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-[#2376A8] text-white text-xs font-semibold hover:bg-[#1b5f87] flex items-center gap-1.5"
                  >
                    <Send className="w-3 h-3" /> Log Interaction
                  </button>
                </div>
              </form>

              {/* Interaction List */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {customerInteractions.map((act) => (
                  <div key={act.id} className="p-2.5 rounded-lg border border-slate-100 bg-white text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-800">
                        [{act.interaction_type}] {act.subject}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(act.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{act.notes}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Customer Create/Edit Modal */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title={editingCustomer ? 'Edit Customer Profile' : 'Add New Customer'}
      >
        <form onSubmit={handleSaveCustomer} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
              <input
                type="text"
                required
                value={customerForm.first_name}
                onChange={(e) => setCustomerForm({ ...customerForm, first_name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
              <input
                type="text"
                required
                value={customerForm.last_name}
                onChange={(e) => setCustomerForm({ ...customerForm, last_name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={customerForm.email}
                onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Country</label>
              <input
                type="text"
                required
                value={customerForm.country}
                onChange={(e) => setCustomerForm({ ...customerForm, country: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Guest Tier</label>
              <select
                value={customerForm.customer_type}
                onChange={(e) => setCustomerForm({ ...customerForm, customer_type: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="new">New Guest</option>
                <option value="returning">Returning Guest</option>
                <option value="vip">VIP Guest</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Internal Notes</label>
            <textarea
              rows={2}
              placeholder="Guest preferences, dietary constraints, travel styles..."
              value={customerForm.internal_notes}
              onChange={(e) => setCustomerForm({ ...customerForm, internal_notes: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCustomerModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#142B45] text-white text-xs font-semibold"
            >
              Save Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* Lead Create Modal */}
      <Modal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        title="Record New Customer Inquiry / Lead"
      >
        <form onSubmit={handleCreateLead} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Name</label>
              <input
                type="text"
                required
                value={leadForm.name}
                onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={leadForm.email}
                onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Inquiry Source</label>
              <select
                value={leadForm.source}
                onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              >
                {LEAD_SOURCES.map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Value ($)</label>
              <input
                type="number"
                placeholder="e.g. 1500"
                value={leadForm.estimated_value}
                onChange={(e) => setLeadForm({ ...leadForm, estimated_value: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Inquiry Details</label>
            <textarea
              required
              rows={3}
              placeholder="What experience or destinations is the prospective guest interested in?"
              value={leadForm.inquiry_text}
              onChange={(e) => setLeadForm({ ...leadForm, inquiry_text: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsLeadModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#2376A8] text-white text-xs font-semibold"
            >
              Submit & Trigger Automation
            </button>
          </div>
        </form>
      </Modal>

      {/* Customer Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Customer Spreadsheet (CSV / Excel)"
      >
        <form onSubmit={handleImportCustomers} className="space-y-4">
          <p className="text-xs text-slate-500">
            Bulk import customer directory from CSV or Excel file. Supported columns:
            <code className="block bg-slate-100 p-2 rounded-lg mt-1 text-slate-700 font-mono text-[11px]">
              email, first_name, last_name, phone, country, satisfaction_score
            </code>
          </p>

          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-[#2376A8]">
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <input
              type="file"
              accept=".csv, .xlsx, .xls"
              onChange={(e) => setImportFile(e.target.files[0])}
              className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-[#2376A8]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isImporting || !importFile}
              className="px-4 py-2 rounded-xl bg-[#2376A8] text-white text-xs font-semibold disabled:opacity-50"
            >
              {isImporting ? 'Importing...' : 'Upload Customers'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CRM;

