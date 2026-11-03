import React, { useState, useEffect } from 'react';
import {
  CalendarCheck2,
  Plus,
  Calendar,
  Clock,
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Star,
  DollarSign,
  FileText,
  Eye,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';

const STATUS_OPTIONS = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];

const Bookings = () => {
  const { activeOrgId } = useAuth();
  const { showToast } = useToast();

  const [bookings, setBookings] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // New Booking Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    customer_id: '',
    experience_id: '',
    booking_date: new Date().toISOString().split('T')[0],
    participants_count: 2,
    special_requests: '',
    status: 'Confirmed',
    payment_status: 'Paid',
  });

  // Selected Booking for Details / Feedback Modal
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');

  useEffect(() => {
    fetchBookings();
    fetchDropdownData();
  }, [activeOrgId, statusFilter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeOrgId) params.org_id = activeOrgId;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/bookings', { params });
      setBookings(res.data);
    } catch (err) {
      console.error('Failed to load bookings', err);
      showToast('Error loading bookings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const params = activeOrgId ? { org_id: activeOrgId } : {};
      const [expRes, custRes] = await Promise.all([
        api.get('/experiences', { params }),
        api.get('/customers', { params }),
      ]);
      setExperiences(expRes.data);
      setCustomers(custRes.data);
      if (expRes.data.length > 0 && !bookingForm.experience_id) {
        setBookingForm((prev) => ({
          ...prev,
          experience_id: expRes.data[0].id,
          customer_id: custRes.data[0]?.id || '',
        }));
      }
    } catch (err) {
      console.error('Error fetching dropdowns', err);
    }
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    try {
      const params = activeOrgId ? { org_id: activeOrgId } : {};
      const payload = {
        ...bookingForm,
        customer_id: parseInt(bookingForm.customer_id, 10),
        experience_id: parseInt(bookingForm.experience_id, 10),
        participants_count: parseInt(bookingForm.participants_count, 10),
      };

      await api.post('/bookings', payload, { params });
      showToast('Booking successfully scheduled & confirmed!', 'success');
      setIsModalOpen(false);
      fetchBookings();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to create booking', 'error');
    }
  };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      const params = activeOrgId ? { org_id: activeOrgId } : {};
      await api.put(`/bookings/${bookingId}`, { status: newStatus }, { params });
      showToast(`Booking marked as ${newStatus}`, 'success');
      fetchBookings();
    } catch (err) {
      showToast('Failed to update booking status', 'error');
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;
    try {
      const params = activeOrgId ? { org_id: activeOrgId } : {};
      await api.put(
        `/bookings/${selectedBooking.id}`,
        {
          feedback_rating: parseFloat(feedbackRating),
          feedback_comment: feedbackComment,
          status: 'Completed',
        },
        { params }
      );
      showToast('Guest feedback recorded successfully', 'success');
      setSelectedBooking(null);
      fetchBookings();
    } catch (err) {
      showToast('Failed to submit feedback', 'error');
    }
  };

  const selectedExp = experiences.find(
    (e) => e.id === parseInt(bookingForm.experience_id, 10)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Tour Scheduling & Booking Operations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time reservations, capacity verification, overbooking prevention, and guest vouchers.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#142B45] to-[#2376A8] hover:opacity-95 text-white text-xs font-semibold shadow-xs transition-all self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Schedule New Booking
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 cursor-pointer"
          >
            <option value="">All Booking Statuses</option>
            {STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <div className="relative flex-1 sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search bookings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-hidden"
          />
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Booking Ref</th>
                <th className="py-3 px-4">Experience Offering</th>
                <th className="py-3 px-4">Guest Name</th>
                <th className="py-3 px-4">Scheduled Date</th>
                <th className="py-3 px-4">Guests</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-[#2376A8]">
                    {b.booking_reference}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 block truncate max-w-[200px]">
                      {b.experience_title}
                    </span>
                    <span className="text-[10px] text-slate-400">{b.destination_name}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-800 block">
                      {b.customer_name}
                    </span>
                    <span className="text-[10px] text-slate-400">{b.customer_email}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">
                    {b.booking_date}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    {b.participants_count} guest(s)
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    ${b.total_price?.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        b.status === 'Confirmed'
                          ? 'bg-sky-50 text-sky-700 border border-sky-200'
                          : b.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : b.status === 'Pending'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <select
                        value={b.status}
                        onChange={(e) => handleUpdateStatus(b.id, e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg text-[10px] py-1 px-1.5 cursor-pointer"
                      >
                        {STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => {
                          setSelectedBooking(b);
                          setFeedbackRating(b.feedback_rating || 5);
                          setFeedbackComment(b.feedback_comment || '');
                        }}
                        className="p-1.5 text-slate-400 hover:text-[#2376A8] hover:bg-slate-100 rounded-lg"
                        title="View Feedback & Voucher"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Booking Modal (with Overbooking Prevention) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Tour Reservation"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateBooking} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Tourism Experience
            </label>
            <select
              required
              value={bookingForm.experience_id}
              onChange={(e) =>
                setBookingForm({ ...bookingForm, experience_id: e.target.value })
              }
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            >
              {experiences.map((exp) => (
                <option key={exp.id} value={exp.id}>
                  {exp.title} (${exp.price} / cap: {exp.capacity})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Registered Customer Guest
            </label>
            <select
              required
              value={bookingForm.customer_id}
              onChange={(e) =>
                setBookingForm({ ...bookingForm, customer_id: e.target.value })
              }
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Departure Date
              </label>
              <input
                type="date"
                required
                value={bookingForm.booking_date}
                onChange={(e) =>
                  setBookingForm({ ...bookingForm, booking_date: e.target.value })
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Number of Participants
              </label>
              <input
                type="number"
                min="1"
                max={selectedExp?.capacity || 20}
                required
                value={bookingForm.participants_count}
                onChange={(e) =>
                  setBookingForm({ ...bookingForm, participants_count: e.target.value })
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          {/* Pricing Preview Banner */}
          {selectedExp && (
            <div className="p-3 bg-sky-50 rounded-xl border border-sky-200/60 text-xs flex items-center justify-between">
              <span className="text-sky-900">
                Rate: <strong>${selectedExp.price}</strong> &times; {bookingForm.participants_count} guests
              </span>
              <span className="font-bold text-sm text-[#142B45]">
                Estimated Total: ${selectedExp.price * parseInt(bookingForm.participants_count || 1, 10)}
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Special Guest Requests
            </label>
            <textarea
              rows={2}
              placeholder="Private transfer, dietary preferences, special occasion..."
              value={bookingForm.special_requests}
              onChange={(e) =>
                setBookingForm({ ...bookingForm, special_requests: e.target.value })
              }
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#142B45] text-white text-xs font-semibold"
            >
              Verify Capacity & Confirm
            </button>
          </div>
        </form>
      </Modal>

      {/* View Booking & Guest Feedback Modal */}
      <Modal
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        title={selectedBooking ? `Booking Voucher: ${selectedBooking.booking_reference}` : ''}
      >
        {selectedBooking && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Experience:</span>
                <strong className="text-slate-900">{selectedBooking.experience_title}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Guest:</span>
                <strong className="text-slate-900">{selectedBooking.customer_name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date & Guests:</span>
                <strong className="text-slate-900">
                  {selectedBooking.booking_date} ({selectedBooking.participants_count} guests)
                </strong>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold">
                <span>Total Amount:</span>
                <span className="text-emerald-700">${selectedBooking.total_price}</span>
              </div>
            </div>

            {/* Feedback Section */}
            <form onSubmit={handleSubmitFeedback} className="space-y-3 pt-2">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Customer Satisfaction & Review
              </h4>

              <div>
                <label className="block text-slate-600 mb-1">Rating (1 to 5 Stars)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackRating(star)}
                      className="p-1 text-slate-300 hover:text-amber-500 focus:outline-hidden"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= feedbackRating
                            ? 'fill-amber-500 text-amber-500'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 font-bold text-slate-700">
                    {feedbackRating}.0 / 5.0
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Feedback Comments</label>
                <textarea
                  rows={2}
                  placeholder="Guest tour remarks and testimonials..."
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#2376A8] text-white font-semibold hover:bg-[#1b5f87]"
                >
                  Save Feedback & Mark Completed
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Bookings;

