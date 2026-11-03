import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Plus,
  Compass,
  CalendarCheck,
  ShieldCheck,
  Edit2,
  Mail,
  Phone,
  Globe,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';

const Organizations = () => {
  const { isSuperAdmin } = useAuth();
  const { showToast } = useToast();

  const [organizations, setOrganizations] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);

  const [orgForm, setOrgForm] = useState({
    name: '',
    slug: '',
    email: '',
    phone: '',
    website: '',
    currency: 'USD',
    description: '',
  });

  const [userForm, setUserForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'admin',
    organization_id: '',
  });

  useEffect(() => {
    fetchOrgsAndUsers();
  }, []);

  const fetchOrgsAndUsers = async () => {
    setLoading(true);
    try {
      const [orgsRes, usersRes] = await Promise.all([
        api.get('/organizations'),
        api.get('/users'),
      ]);
      setOrganizations(orgsRes.data);
      setUsersList(usersRes.data);
      if (orgsRes.data.length > 0 && !userForm.organization_id) {
        setUserForm((prev) => ({ ...prev, organization_id: orgsRes.data[0].id }));
      }
    } catch (err) {
      console.error('Error fetching orgs', err);
      showToast('Error loading organizations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOrg = async (e) => {
    e.preventDefault();
    try {
      if (editingOrg) {
        await api.put(`/organizations/${editingOrg.id}`, orgForm);
        showToast('Organization updated successfully', 'success');
      } else {
        await api.post('/organizations', orgForm);
        showToast('New client organization created', 'success');
      }
      setIsOrgModalOpen(false);
      setEditingOrg(null);
      fetchOrgsAndUsers();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to save organization', 'error');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', {
        ...userForm,
        organization_id: userForm.organization_id ? parseInt(userForm.organization_id, 10) : null,
      });
      showToast('Admin user account created successfully', 'success');
      setIsUserModalOpen(false);
      setUserForm({
        full_name: '',
        email: '',
        password: '',
        role: 'admin',
        organization_id: organizations[0]?.id || '',
      });
      fetchOrgsAndUsers();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to create user', 'error');
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-800">Access Restricted</h3>
        <p className="text-xs text-slate-500 mt-1">
          Only Super Administrator accounts possess authority to manage platform organizations and accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Organization & Account Governance
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Super Admin platform controls: onboard client tourism businesses and configure Admin credentials.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsUserModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-[#2376A8]" />
            Create Admin User
          </button>
          <button
            onClick={() => {
              setEditingOrg(null);
              setOrgForm({
                name: '',
                slug: '',
                email: '',
                phone: '',
                website: '',
                currency: 'USD',
                description: '',
              });
              setIsOrgModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#142B45] to-[#2376A8] hover:opacity-95 text-white text-xs font-semibold shadow-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Organization
          </button>
        </div>
      </div>

      {/* Organizations Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {organizations.map((org) => (
          <div
            key={org.id}
            className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-lg shrink-0 shadow-xs"
                    style={{ backgroundColor: org.primary_color || '#142B45' }}
                  >
                    {org.name[0]}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {org.name}
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400">
                      slug: {org.slug} &bull; Currency: {org.currency}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setEditingOrg(org);
                    setOrgForm({
                      name: org.name,
                      slug: org.slug,
                      email: org.email,
                      phone: org.phone || '',
                      website: org.website || '',
                      currency: org.currency,
                      description: org.description || '',
                    });
                    setIsOrgModalOpen(true);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                {org.description || 'Full-service digital tourism client operator.'}
              </p>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Guests</span>
                  <span className="text-sm font-bold text-slate-900">{org.total_customers || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Tours</span>
                  <span className="text-sm font-bold text-slate-900">{org.total_experiences || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Bookings</span>
                  <span className="text-sm font-bold text-slate-900">{org.total_bookings || 0}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="truncate">{org.email}</span>
              <span className="font-semibold text-emerald-600">Active Tenant</span>
            </div>
          </div>
        ))}
      </div>

      {/* Users / Admins Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          Platform User Accounts & Assigned Roles
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">User Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Assigned Organization</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usersList.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900">{u.full_name}</td>
                  <td className="py-3 px-4 text-slate-600">{u.email}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        u.role === 'super_admin'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-sky-50 text-sky-700 border border-sky-200'
                      }`}
                    >
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">
                    {u.organization_name || 'All Organizations (Platform-wide)'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Org Create/Edit Modal */}
      <Modal
        isOpen={isOrgModalOpen}
        onClose={() => setIsOrgModalOpen(false)}
        title={editingOrg ? 'Edit Organization' : 'Onboard New Tourism Organization'}
      >
        <form onSubmit={handleSaveOrg} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name</label>
              <input
                type="text"
                required
                value={orgForm.name}
                onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Slug (Identifier)</label>
              <input
                type="text"
                required
                value={orgForm.slug}
                onChange={(e) => setOrgForm({ ...orgForm, slug: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email</label>
              <input
                type="email"
                required
                value={orgForm.email}
                onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Currency</label>
              <select
                value={orgForm.currency}
                onChange={(e) => setOrgForm({ ...orgForm, currency: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={orgForm.description}
              onChange={(e) => setOrgForm({ ...orgForm, description: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsOrgModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#142B45] text-white text-xs font-semibold"
            >
              Save Organization
            </button>
          </div>
        </form>
      </Modal>

      {/* User Create Modal */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title="Create Admin User Account"
      >
        <form onSubmit={handleCreateUser} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={userForm.full_name}
              onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Organization</label>
            <select
              value={userForm.organization_id}
              onChange={(e) => setUserForm({ ...userForm, organization_id: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsUserModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#2376A8] text-white text-xs font-semibold"
            >
              Create Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Organizations;

