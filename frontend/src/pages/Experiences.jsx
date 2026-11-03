import React, { useState, useEffect } from 'react';
import {
  Palmtree,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Users,
  Star,
  CheckCircle2,
  XCircle,
  Eye,
  Calendar,
  Compass,
  Layers,
  ChevronRight,
  Filter,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';

const CATEGORIES = [
  'Cultural Tourism',
  'Historical Tours',
  'Adventure Tourism',
  'Food and Culinary Experiences',
  'Nature and Wildlife',
  'City Sightseeing',
  'Beach Experiences',
  'Customized Travel Experiences',
];

const Experiences = () => {
  const { activeOrgId } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('experiences'); // 'experiences', 'destinations', 'itineraries'
  const [experiences, setExperiences] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [itineraries, setItineraries] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Experience Modal
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [editingExp, setEditingExp] = useState(null);
  const [expForm, setExpForm] = useState({
    title: '',
    category: 'Adventure Tourism',
    destination_id: '',
    price: '',
    duration_hours: 4.0,
    duration_days: 1,
    capacity: 12,
    min_participants: 1,
    short_description: '',
    description: '',
    image_url: '',
    is_active: true,
  });

  // Destination Modal
  const [isDestModalOpen, setIsDestModalOpen] = useState(false);
  const [editingDest, setEditingDest] = useState(null);
  const [destForm, setDestForm] = useState({
    name: '',
    country: '',
    region: '',
    climate: '',
    best_season: '',
    description: '',
    image_url: '',
    is_featured: false,
  });

  // Itinerary Modal
  const [isItinModalOpen, setIsItinModalOpen] = useState(false);
  const [itinForm, setItinForm] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    is_custom: false,
  });

  useEffect(() => {
    fetchExperiencesAndDestinations();
  }, [activeOrgId, activeTab, categoryFilter]);

  const fetchExperiencesAndDestinations = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeOrgId) params.org_id = activeOrgId;

      if (activeTab === 'experiences') {
        if (categoryFilter) params.category = categoryFilter;
        const [expRes, destRes] = await Promise.all([
          api.get('/experiences', { params }),
          api.get('/destinations', { params: activeOrgId ? { org_id: activeOrgId } : {} }),
        ]);
        setExperiences(expRes.data);
        setDestinations(destRes.data);
      } else if (activeTab === 'destinations') {
        const destRes = await api.get('/destinations', { params });
        setDestinations(destRes.data);
      } else if (activeTab === 'itineraries') {
        const itinRes = await api.get('/itineraries', { params });
        setItineraries(itinRes.data);
      }
    } catch (err) {
      console.error('Error fetching tourism data', err);
      showToast('Error loading experiences data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExperience = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...expForm,
        destination_id: parseInt(expForm.destination_id, 10),
        price: parseFloat(expForm.price),
        duration_hours: parseFloat(expForm.duration_hours),
        duration_days: parseInt(expForm.duration_days, 10),
        capacity: parseInt(expForm.capacity, 10),
        min_participants: parseInt(expForm.min_participants, 10),
      };

      const params = activeOrgId ? { org_id: activeOrgId } : {};

      if (editingExp) {
        await api.put(`/experiences/${editingExp.id}`, payload, { params });
        showToast('Tourism experience updated successfully', 'success');
      } else {
        await api.post('/experiences', payload, { params });
        showToast('New tourism experience published', 'success');
      }

      setIsExpModalOpen(false);
      setEditingExp(null);
      fetchExperiencesAndDestinations();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to save experience', 'error');
    }
  };

  const handleDeleteExperience = async (id) => {
    if (!window.confirm('Are you sure you want to remove or deactivate this experience?')) return;
    try {
      const params = activeOrgId ? { org_id: activeOrgId } : {};
      await api.delete(`/experiences/${id}`, { params });
      showToast('Experience status updated', 'success');
      fetchExperiencesAndDestinations();
    } catch (err) {
      showToast('Failed to delete experience', 'error');
    }
  };

  const handleSaveDestination = async (e) => {
    e.preventDefault();
    try {
      const params = activeOrgId ? { org_id: activeOrgId } : {};
      if (editingDest) {
        await api.put(`/destinations/${editingDest.id}`, destForm, { params });
        showToast('Destination details updated', 'success');
      } else {
        await api.post('/destinations', destForm, { params });
        showToast('New destination added', 'success');
      }
      setIsDestModalOpen(false);
      setEditingDest(null);
      fetchExperiencesAndDestinations();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to save destination', 'error');
    }
  };

  const handleSaveItinerary = async (e) => {
    e.preventDefault();
    try {
      const params = activeOrgId ? { org_id: activeOrgId } : {};
      await api.post('/itineraries', itinForm, { params });
      showToast('New tour itinerary created', 'success');
      setIsItinModalOpen(false);
      fetchExperiencesAndDestinations();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to save itinerary', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Tourism Experience Design & Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Design, price, and schedule tourism offerings, manage destinations, and craft guest itineraries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'experiences' && (
            <button
              onClick={() => {
                setEditingExp(null);
                setExpForm({
                  title: '',
                  category: 'Adventure Tourism',
                  destination_id: destinations[0]?.id || '',
                  price: '',
                  duration_hours: 4.0,
                  duration_days: 1,
                  capacity: 12,
                  min_participants: 1,
                  short_description: '',
                  description: '',
                  image_url:
                    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
                  is_active: true,
                });
                setIsExpModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#142B45] to-[#2376A8] hover:opacity-95 text-white text-xs font-semibold shadow-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              New Experience
            </button>
          )}

          {activeTab === 'destinations' && (
            <button
              onClick={() => {
                setEditingDest(null);
                setDestForm({
                  name: '',
                  country: '',
                  region: '',
                  climate: '',
                  best_season: '',
                  description: '',
                  image_url:
                    'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=600&q=80',
                  is_featured: false,
                });
                setIsDestModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#142B45] to-[#2376A8] hover:opacity-95 text-white text-xs font-semibold shadow-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Destination
            </button>
          )}

          {activeTab === 'itineraries' && (
            <button
              onClick={() => {
                setItinForm({
                  title: '',
                  description: '',
                  start_date: new Date().toISOString().split('T')[0],
                  end_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
                  is_custom: false,
                });
                setIsItinModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#142B45] to-[#2376A8] hover:opacity-95 text-white text-xs font-semibold shadow-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Itinerary
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs & Category Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('experiences')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'experiences'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Experiences ({experiences.length})
          </button>
          <button
            onClick={() => setActiveTab('destinations')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'destinations'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Destinations ({destinations.length})
          </button>
          <button
            onClick={() => setActiveTab('itineraries')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'itineraries'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Itineraries ({itineraries.length})
          </button>
        </div>

        {activeTab === 'experiences' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 cursor-pointer"
            >
              <option value="">All Experience Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tab 1: Experience Offerings Grid */}
      {activeTab === 'experiences' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {experiences.map((exp) => (
            <div
              key={exp.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
            >
              <div>
                {/* Image Cover with Badges */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                  <img
                    src={exp.image_url}
                    alt={exp.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/70 text-white backdrop-blur-xs">
                      {exp.category}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs ${
                        exp.is_active
                          ? 'bg-emerald-500/90 text-white'
                          : 'bg-slate-500/90 text-white'
                      }`}
                    >
                      {exp.is_active ? 'Active' : 'Draft / Off'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#2376A8]" />
                    <span>{exp.destination_name}</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1 mb-1">
                    {exp.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                    {exp.short_description || exp.description}
                  </p>

                  <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-slate-100 text-[11px] text-slate-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{exp.duration_hours}h</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Cap: {exp.capacity}</span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-600 font-semibold">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{exp.rating} ({exp.reviews_count})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer: Price & Actions */}
              <div className="p-4 px-5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">
                    Per Guest
                  </span>
                  <span className="text-lg font-bold text-[#142B45]">
                    ${exp.price?.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingExp(exp);
                      setExpForm({
                        title: exp.title,
                        category: exp.category,
                        destination_id: exp.destination_id,
                        price: exp.price,
                        duration_hours: exp.duration_hours,
                        duration_days: exp.duration_days,
                        capacity: exp.capacity,
                        min_participants: exp.min_participants,
                        short_description: exp.short_description || '',
                        description: exp.description,
                        image_url: exp.image_url,
                        is_active: exp.is_active,
                      });
                      setIsExpModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors"
                    title="Edit Experience"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteExperience(exp.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Deactivate Experience"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Destination Management */}
      {activeTab === 'destinations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.map((dest) => (
            <div
              key={dest.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={dest.image_url}
                    alt={dest.name}
                    className="w-full h-full object-cover"
                  />
                  {dest.is_featured && (
                    <span className="absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#27A69A] text-white">
                      Featured Destination
                    </span>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    {dest.name}
                  </h3>
                  <p className="text-xs text-slate-500 mb-2">
                    {dest.country} &bull; {dest.region || 'Regional Hub'}
                  </p>
                  <p className="text-xs text-slate-600 line-clamp-3 mb-4">
                    {dest.description}
                  </p>

                  <div className="text-[11px] text-slate-500 space-y-1 py-2 border-t border-slate-100">
                    <div>Climate: <strong className="text-slate-700">{dest.climate || 'Seasonal'}</strong></div>
                    <div>Best Season: <strong className="text-slate-700">{dest.best_season || 'Year-round'}</strong></div>
                  </div>
                </div>
              </div>

              <div className="p-4 px-5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-[#2376A8]">
                  {dest.experiences_count || 0} associated tour(s)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingDest(dest);
                      setDestForm({
                        name: dest.name,
                        country: dest.country,
                        region: dest.region || '',
                        climate: dest.climate || '',
                        best_season: dest.best_season || '',
                        description: dest.description || '',
                        image_url: dest.image_url || '',
                        is_featured: dest.is_featured,
                      });
                      setIsDestModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Itineraries Planner */}
      {activeTab === 'itineraries' && (
        <div className="space-y-4">
          {itineraries.map((itin) => (
            <div
              key={itin.id}
              className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {itin.title}
                    </h3>
                    {itin.booking_reference && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-sky-50 text-[#2376A8] border border-sky-200">
                        Linked: {itin.booking_reference}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{itin.description}</p>
                </div>

                <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#27A69A]" />
                  <span>
                    {itin.start_date} to {itin.end_date}
                  </span>
                </div>
              </div>

              {/* Activities Timeline */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Scheduled Itinerary Timeline ({itin.activities?.length || 0} activities)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(itin.activities || []).map((act) => (
                    <div
                      key={act.id}
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-start gap-3 text-xs"
                    >
                      <div className="w-7 h-7 rounded-lg bg-[#142B45] text-white font-bold flex items-center justify-center shrink-0 text-xs">
                        D{act.day_number}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-900">{act.activity_name}</strong>
                          <span className="text-[11px] font-mono text-slate-500">
                            {act.scheduled_time} ({act.duration})
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-0.5">{act.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Experience Create / Edit Modal */}
      <Modal
        isOpen={isExpModalOpen}
        onClose={() => setIsExpModalOpen(false)}
        title={editingExp ? 'Edit Tourism Experience' : 'Design New Tourism Experience'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveExperience} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Experience Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Glacier Peak Sunrise Trek & Fondue"
                value={expForm.title}
                onChange={(e) => setExpForm({ ...expForm, title: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tourism Category
              </label>
              <select
                value={expForm.category}
                onChange={(e) => setExpForm({ ...expForm, category: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Associated Destination
              </label>
              <select
                required
                value={expForm.destination_id}
                onChange={(e) => setExpForm({ ...expForm, destination_id: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              >
                {destinations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.country})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pricing ($ USD / Guest)
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="290"
                value={expForm.price}
                onChange={(e) => setExpForm({ ...expForm, price: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Max Participant Capacity
              </label>
              <input
                type="number"
                required
                placeholder="12"
                value={expForm.capacity}
                onChange={(e) => setExpForm({ ...expForm, capacity: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Duration (Hours)
              </label>
              <input
                type="number"
                step="0.5"
                required
                value={expForm.duration_hours}
                onChange={(e) => setExpForm({ ...expForm, duration_hours: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Image URL
              </label>
              <input
                type="url"
                required
                value={expForm.image_url}
                onChange={(e) => setExpForm({ ...expForm, image_url: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Short Description / Highlight
            </label>
            <input
              type="text"
              placeholder="Highlight for cards & vouchers..."
              value={expForm.short_description}
              onChange={(e) => setExpForm({ ...expForm, short_description: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Experience Description
            </label>
            <textarea
              required
              rows={3}
              value={expForm.description}
              onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={expForm.is_active}
              onChange={(e) => setExpForm({ ...expForm, is_active: e.target.checked })}
              className="rounded-sm text-[#2376A8]"
            />
            <label htmlFor="is_active" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Active & Available for Guest Reservations
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsExpModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#142B45] text-white text-xs font-semibold"
            >
              Publish Experience
            </button>
          </div>
        </form>
      </Modal>

      {/* Destination Create Modal */}
      <Modal
        isOpen={isDestModalOpen}
        onClose={() => setIsDestModalOpen(false)}
        title={editingDest ? 'Edit Destination' : 'Add New Tourism Destination'}
      >
        <form onSubmit={handleSaveDestination} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Destination Name</label>
              <input
                type="text"
                required
                value={destForm.name}
                onChange={(e) => setDestForm({ ...destForm, name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Country</label>
              <input
                type="text"
                required
                value={destForm.country}
                onChange={(e) => setDestForm({ ...destForm, country: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Region / State</label>
              <input
                type="text"
                value={destForm.region}
                onChange={(e) => setDestForm({ ...destForm, region: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Climate</label>
              <input
                type="text"
                value={destForm.climate}
                onChange={(e) => setDestForm({ ...destForm, climate: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Image URL</label>
            <input
              type="url"
              required
              value={destForm.image_url}
              onChange={(e) => setDestForm({ ...destForm, image_url: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={destForm.description}
              onChange={(e) => setDestForm({ ...destForm, description: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsDestModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#2376A8] text-white text-xs font-semibold"
            >
              Save Destination
            </button>
          </div>
        </form>
      </Modal>

      {/* Itinerary Create Modal */}
      <Modal
        isOpen={isItinModalOpen}
        onClose={() => setIsItinModalOpen(false)}
        title="Craft New Multi-Day Itinerary"
      >
        <form onSubmit={handleSaveItinerary} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Itinerary Title</label>
            <input
              type="text"
              required
              placeholder="e.g. 3-Day Coastal Kayak & Capri Odyssey"
              value={itinForm.title}
              onChange={(e) => setItinForm({ ...itinForm, title: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={itinForm.start_date}
                onChange={(e) => setItinForm({ ...itinForm, start_date: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                required
                value={itinForm.end_date}
                onChange={(e) => setItinForm({ ...itinForm, end_date: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Overview & Notes</label>
            <textarea
              rows={3}
              placeholder="Curated expedition highlights..."
              value={itinForm.description}
              onChange={(e) => setItinForm({ ...itinForm, description: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsItinModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#142B45] text-white text-xs font-semibold"
            >
              Create Itinerary
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Experiences;

