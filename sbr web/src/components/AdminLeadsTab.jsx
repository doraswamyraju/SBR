import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  Inbox, 
  Search, 
  Filter, 
  RefreshCw, 
  Phone, 
  Mail, 
  MapPin, 
  Tag, 
  Calendar, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  Edit3, 
  X, 
  MessageSquare,
  Gift
} from 'lucide-react';

const AdminLeadsTab = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');

  // Edit / Status Update Modal State
  const [editingLead, setEditingLead] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [editStatus, setEditStatus] = useState('New');
  const [adminNotes, setAdminNotes] = useState('');

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('api/leads');
      if (res.success && res.data) {
        setLeads(res.data);
      } else {
        setError(res.error || 'Failed to load form submissions');
      }
    } catch (err) {
      setError('Error connecting to leads API server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleOpenEdit = (lead) => {
    setEditingLead(lead);
    setEditStatus(lead.status || 'New');
    setAdminNotes(lead.adminNotes || '');
  };

  const handleUpdateLead = async (e) => {
    e.preventDefault();
    if (!editingLead) return;
    try {
      setSubmitting(true);
      const res = await api.put(`api/leads/${editingLead._id}`, {
        status: editStatus,
        adminNotes: adminNotes.trim()
      });
      if (res.success) {
        setSuccessMsg(`Lead status updated to "${editStatus}"`);
        setEditingLead(null);
        fetchLeads();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(res.error || 'Failed to update lead');
      }
    } catch (err) {
      setError('Error updating lead status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLead = async (id) => {
    if (!window.confirm('Are you sure you want to delete this form submission?')) return;
    try {
      const res = await api.delete(`api/leads/${id}`);
      if (res.success) {
        setSuccessMsg('Form submission deleted successfully');
        fetchLeads();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(res.error || 'Failed to delete lead');
      }
    } catch (err) {
      setError('Error deleting lead');
    }
  };

  // Filter leads
  const filteredLeads = leads.filter(l => {
    const matchesSearch = 
      (l.name && l.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (l.phone && l.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (l.email && l.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (l.productOrService && l.productOrService.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (l.address && l.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (l.notes && l.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (l.referralCode && l.referralCode.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
    const matchesSource = sourceFilter === 'All' || l.source === sourceFilter;

    return matchesSearch && matchesStatus && matchesSource;
  });

  // Analytics Metrics
  const totalLeads = leads.length;
  const newLeads = leads.filter(l => l.status === 'New').length;
  const contactedLeads = leads.filter(l => l.status === 'Contacted').length;
  const convertedLeads = leads.filter(l => l.status === 'Converted').length;

  const getSourceBadgeClass = (source) => {
    switch (source) {
      case 'Hero Quote Form':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Discount Popup':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Product Page Quote':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Contact Form':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'New':
        return 'bg-red-50 text-red-700 border-red-200 font-bold';
      case 'Contacted':
        return 'bg-amber-50 text-amber-700 border-amber-200 font-medium';
      case 'Qualified':
        return 'bg-blue-50 text-blue-700 border-blue-200 font-medium';
      case 'Converted':
        return 'bg-green-50 text-green-700 border-green-200 font-bold';
      case 'Closed':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Inbox className="w-6 h-6 text-blue-600" />
            Website Form Submissions & Leads
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time inquiries received from website popup forms, hero section quotes, and product page booking forms.
          </p>
        </div>
        <button
          onClick={fetchLeads}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition shadow-sm cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          Refresh
        </button>
      </div>

      {/* FEEDBACK ALERTS */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between text-red-700 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between text-green-700 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-green-400 hover:text-green-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Total Submissions</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{totalLeads}</span>
          </div>
          <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
            <Inbox className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-red-500 font-semibold uppercase tracking-wider block">New Inquiries</span>
            <span className="text-2xl font-extrabold text-red-600 mt-1 block">{newLeads}</span>
          </div>
          <div className="w-11 h-11 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-amber-500 font-semibold uppercase tracking-wider block">Contacted</span>
            <span className="text-2xl font-extrabold text-amber-600 mt-1 block">{contactedLeads}</span>
          </div>
          <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-600 font-semibold uppercase tracking-wider block">Converted Orders</span>
            <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">{convertedLeads}</span>
          </div>
          <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, phone, email, product, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
          {/* Source Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="text-xs font-medium border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Form Sources</option>
              <option value="Hero Quote Form">Hero Quote Form</option>
              <option value="Discount Popup">Discount Popup (10%)</option>
              <option value="Product Page Quote">Product Page Quote</option>
              <option value="Contact Form">Contact Form</option>
              <option value="Other">Other / Website</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-medium border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
          >
            <option value="All">All Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Converted">Converted</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* LEADS DATA TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
            Loading submissions...
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Inbox className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No form submissions match the filters</p>
            <p className="text-xs text-slate-400 mt-1">Website leads will appear here as visitors submit quotes and contact requests.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Customer Details</th>
                  <th className="py-3 px-4">Product / Inquired Item</th>
                  <th className="py-3 px-4">Form Source</th>
                  <th className="py-3 px-4">Submitted Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredLeads.map((lead) => (
                  <tr key={lead._id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{lead.name}</div>
                      <div className="flex flex-col gap-1 mt-1 text-xs text-slate-500">
                        {lead.phone && (
                          <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 text-blue-600 hover:underline">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {lead.phone}
                          </a>
                        )}
                        {lead.email && (
                          <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 text-slate-600 hover:underline">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {lead.email}
                          </a>
                        )}
                        {lead.address && (
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {lead.address}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Product */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-blue-500" />
                        {lead.productOrService || 'General Inquiry'}
                      </div>
                      {lead.notes && (
                        <p className="text-xs text-slate-500 mt-1 max-w-xs line-clamp-2 italic">
                          "{lead.notes}"
                        </p>
                      )}
                      {lead.referralCode && (
                        <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          <Gift className="w-3 h-3" /> Ref Code: {lead.referralCode}
                        </div>
                      )}
                    </td>

                    {/* Source */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getSourceBadgeClass(lead.source)}`}>
                        {lead.source}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(lead.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs border ${getStatusBadgeClass(lead.status)}`}>
                        {lead.status}
                      </span>
                      {lead.adminNotes && (
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1" title={lead.adminNotes}>
                          <MessageSquare className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[130px]">{lead.adminNotes}</span>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(lead)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition cursor-pointer"
                        title="Update Status / Notes"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Update
                      </button>
                      <button
                        onClick={() => handleDeleteLead(lead._id)}
                        className="inline-flex items-center p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        title="Delete Lead"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* UPDATE STATUS MODAL */}
      {editingLead && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden animate-scale-in">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                Update Lead Status
              </h3>
              <button 
                onClick={() => setEditingLead(null)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateLead} className="p-5 space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Customer</span>
                <p className="text-sm font-semibold text-slate-900">{editingLead.name}</p>
                <p className="text-xs text-slate-500">{editingLead.phone} | {editingLead.productOrService}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Lead Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="New">New (Needs Follow-up)</option>
                  <option value="Contacted">Contacted (Called customer)</option>
                  <option value="Qualified">Qualified (Interested in quote)</option>
                  <option value="Converted">Converted (Deal closed / Order placed)</option>
                  <option value="Closed">Closed (Not interested / Invalid)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Admin Follow-up Remarks
                </label>
                <textarea
                  rows="3"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="E.g. Called customer at 2 PM, sent catalog for 300L Solar Heater..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingLead(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Save Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLeadsTab;

