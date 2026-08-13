import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  Gift, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Sparkles, 
  RefreshCw, 
  Edit3, 
  X,
  PhoneCall,
  UserCheck,
  DollarSign,
  Tag,
  Users,
  CreditCard,
  Send,
  AlertCircle
} from 'lucide-react';

const AdminReferralsTab = () => {
  const [activeSubTab, setActiveSubTab] = useState('leads'); // 'leads' or 'claims'
  const [referrals, setReferrals] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Lead Status Update Modal
  const [editingReferral, setEditingReferral] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    status: 'Pending',
    purchaseAmount: '',
    rewardAmount: '',
    notes: ''
  });

  // Claim Status Update Modal
  const [editingClaim, setEditingClaim] = useState(null);
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimFormData, setClaimFormData] = useState({
    status: 'Paid',
    transactionRef: '',
    adminNotes: ''
  });

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const [refRes, claimRes] = await Promise.all([
        api.get('api/referrals/admin/all'),
        api.get('api/referrals/admin/claims')
      ]);

      if (refRes.success && refRes.data) {
        setReferrals(refRes.data);
      }
      if (claimRes.success && claimRes.data) {
        setClaims(claimRes.data);
      }
    } catch (err) {
      setError('Error connecting to referrals & claims API');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = (refItem) => {
    setEditingReferral(refItem);
    setFormData({
      status: refItem.status || 'Pending',
      purchaseAmount: refItem.purchaseAmount || '',
      rewardAmount: refItem.rewardAmount || '',
      notes: refItem.notes || ''
    });
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingReferral) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await api.put(`api/referrals/admin/${editingReferral._id}/status`, formData);
      if (res.success) {
        setSuccessMsg(`Referral lead updated to status "${formData.status}"`);
        setEditingReferral(null);
        fetchAdminData();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(res.error || 'Failed to update referral lead');
      }
    } catch (err) {
      setError('Error updating referral lead');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenClaimEditModal = (claimItem) => {
    setEditingClaim(claimItem);
    setClaimFormData({
      status: claimItem.status === 'Pending' ? 'Paid' : claimItem.status,
      transactionRef: claimItem.transactionRef || '',
      adminNotes: claimItem.adminNotes || ''
    });
  };

  const handleUpdateClaimSubmit = async (e) => {
    e.preventDefault();
    if (!editingClaim) return;

    setClaimSubmitting(true);
    setError('');

    try {
      const res = await api.put(`api/referrals/admin/claims/${editingClaim._id}/status`, claimFormData);
      if (res.success) {
        setSuccessMsg(`Payout claim updated to status "${claimFormData.status}"`);
        setEditingClaim(null);
        fetchAdminData();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(res.error || 'Failed to update payout claim');
      }
    } catch (err) {
      setError('Error updating payout claim');
    } finally {
      setClaimSubmitting(false);
    }
  };

  const filteredReferrals = referrals.filter(refItem => {
    const searchLower = searchQuery.toLowerCase();
    const referrerName = refItem.referrerId?.name || '';
    const refereeName = refItem.refereeName || '';
    const refereePhone = refItem.refereePhone || '';
    const productName = refItem.productName || '';

    const matchesSearch = referrerName.toLowerCase().includes(searchLower) ||
                          refereeName.toLowerCase().includes(searchLower) ||
                          refereePhone.includes(searchLower) ||
                          productName.toLowerCase().includes(searchLower);

    const matchesStatus = statusFilter === 'All' || refItem.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const filteredClaims = claims.filter(claimItem => {
    const searchLower = searchQuery.toLowerCase();
    const uName = claimItem.userName || '';
    const uPhone = claimItem.userPhone || '';
    const pDetails = claimItem.payoutDetails || '';

    return uName.toLowerCase().includes(searchLower) ||
           uPhone.includes(searchLower) ||
           pDetails.toLowerCase().includes(searchLower);
  });

  const totalLeads = referrals.length;
  const pendingLeads = referrals.filter(r => r.status === 'Pending' || r.status === 'Contacted').length;
  const pendingClaimsCount = claims.filter(c => c.status === 'Pending').length;
  const totalPaidOut = claims
    .filter(c => c.status === 'Paid')
    .reduce((sum, c) => sum + (c.amount || 0), 0);

  return (
    <div className="space-y-6 text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-800/80 border border-slate-700/60 backdrop-blur-md shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Gift className="w-6 h-6 text-sky-400" /> Customer Referral & Payout Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track customer lead submissions, close sales deals, verify referral rewards, and process payout claims (Min ₹500).
          </p>
        </div>
        <button
          onClick={fetchAdminData}
          className="flex items-center justify-center gap-2 bg-slate-700/60 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-600/50 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Pipeline
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-700/50 text-emerald-300 rounded-xl flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-white"><X className="w-4 h-4"/></button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-950/60 border border-rose-700/50 text-rose-300 rounded-xl flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2 text-sm font-medium">
            <XCircle className="w-5 h-5 text-rose-400" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-400 hover:text-white"><X className="w-4 h-4"/></button>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700/60 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-950/80 border border-sky-800/50 flex items-center justify-center text-sky-400 flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Total Referral Leads</span>
            <span className="text-xl font-extrabold text-white">{totalLeads}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700/60 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-950/80 border border-purple-800/50 flex items-center justify-center text-purple-400 flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Pending Leads</span>
            <span className="text-xl font-extrabold text-purple-300">{pendingLeads}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700/60 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-800/50 flex items-center justify-center text-amber-400 flex-shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Pending Payout Requests</span>
            <span className="text-xl font-extrabold text-amber-400">{pendingClaimsCount}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700/60 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-800/50 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Total Payouts Transferred</span>
            <span className="text-xl font-extrabold text-emerald-400">₹{totalPaidOut.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-700/80 pb-2">
        <button
          onClick={() => setActiveSubTab('leads')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'leads'
              ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
              : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700'
          }`}
        >
          <Gift className="w-4 h-4" /> Customer Referral Leads ({referrals.length})
        </button>

        <button
          onClick={() => setActiveSubTab('claims')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'claims'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
              : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700'
          }`}
        >
          <CreditCard className="w-4 h-4" /> Payout Claim Requests ({claims.length})
          {pendingClaimsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-extrabold">
              {pendingClaimsCount} PENDING
            </span>
          )}
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeSubTab === 'leads' ? "Search referrer, friend or product..." : "Search customer name, phone or UPI details..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-700 text-white placeholder-slate-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500"
          />
        </div>

        {activeSubTab === 'leads' && (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-300">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900/80 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Contacted">Contacted</option>
              <option value="Purchased">Purchased / Converted</option>
              <option value="Reward Credited">Reward Credited</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        )}
      </div>

      {/* REFERRAL LEADS TABLE */}
      {activeSubTab === 'leads' && (
        <div className="rounded-2xl bg-slate-800/70 border border-slate-700/60 shadow-xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="animate-spin w-8 h-8 border-4 border-sky-400 border-t-transparent rounded-full mx-auto mb-3"></div>
              Loading referral pipeline...
            </div>
          ) : filteredReferrals.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              No referral leads found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-700/80 text-slate-300 font-semibold text-xs uppercase tracking-wider">
                    <th className="py-4 px-4">Referrer Customer</th>
                    <th className="py-4 px-4">Referred Friend</th>
                    <th className="py-4 px-4">Product Interest</th>
                    <th className="py-4 px-4">Date</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4">Deal Sale (₹)</th>
                    <th className="py-4 px-4">Reward (₹)</th>
                    <th className="py-4 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {filteredReferrals.map((refItem) => (
                    <tr key={refItem._id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-bold text-white">{refItem.referrerId?.name || 'Customer'}</div>
                        <div className="text-xs text-amber-400 font-mono mt-0.5">{refItem.referralCode}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-100">{refItem.refereeName}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <PhoneCall className="w-3 h-3 text-sky-400" /> {refItem.refereePhone}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-medium">
                        <span className="px-2.5 py-1 bg-sky-950/80 text-sky-300 border border-sky-800/50 rounded-lg text-xs font-semibold">
                          {refItem.productName}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-400">
                        {new Date(refItem.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="py-4 px-4">
                        {refItem.status === 'Reward Credited' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800/50 px-2.5 py-1 rounded-full">
                            <CheckCircle className="w-3 h-3" /> Credited
                          </span>
                        ) : refItem.status === 'Purchased' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 bg-sky-950/80 border border-sky-800/50 px-2.5 py-1 rounded-full">
                            <Sparkles className="w-3 h-3" /> Converted
                          </span>
                        ) : refItem.status === 'Contacted' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-950/80 border border-amber-800/50 px-2.5 py-1 rounded-full">
                            Contacted
                          </span>
                        ) : refItem.status === 'Rejected' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400 bg-rose-950/80 border border-rose-800/50 px-2.5 py-1 rounded-full">
                            Closed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-300 bg-purple-950/80 border border-purple-800/50 px-2.5 py-1 rounded-full">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-200">
                        {refItem.purchaseAmount > 0 ? `₹${refItem.purchaseAmount.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-4 px-4 font-bold text-amber-400">
                        ₹{refItem.rewardAmount?.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => handleOpenEditModal(refItem)}
                          className="p-2 text-sky-400 hover:text-white hover:bg-sky-600/30 rounded-lg transition-colors cursor-pointer"
                          title="Update Lead Status & Reward"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* PAYOUT CLAIMS QUEUE TABLE */}
      {activeSubTab === 'claims' && (
        <div className="rounded-2xl bg-slate-800/70 border border-slate-700/60 shadow-xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="animate-spin w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full mx-auto mb-3"></div>
              Loading payout claims queue...
            </div>
          ) : filteredClaims.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              No payout claim requests found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-700/80 text-slate-300 font-semibold text-xs uppercase tracking-wider">
                    <th className="py-4 px-4">Customer Name & Phone</th>
                    <th className="py-4 px-4">Transfer Method & Details</th>
                    <th className="py-4 px-4">Claim Amount</th>
                    <th className="py-4 px-4">Date</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4">Transaction Ref</th>
                    <th className="py-4 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {filteredClaims.map((claimItem) => (
                    <tr key={claimItem._id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-bold text-white">{claimItem.userName}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <PhoneCall className="w-3 h-3 text-sky-400" /> {claimItem.userPhone}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-xs text-sky-300 font-mono block font-bold">{claimItem.payoutMethod}</span>
                        <span className="text-sm font-semibold text-slate-200">{claimItem.payoutDetails}</span>
                      </td>
                      <td className="py-4 px-4 font-black text-amber-400 text-base">
                        ₹{claimItem.amount.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-400">
                        {new Date(claimItem.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-4 px-4">
                        {claimItem.status === 'Paid' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800/50 px-2.5 py-1 rounded-full">
                            <CheckCircle className="w-3 h-3" /> Transferred & Paid
                          </span>
                        ) : claimItem.status === 'Approved' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 bg-sky-950/80 border border-sky-800/50 px-2.5 py-1 rounded-full">
                            Approved
                          </span>
                        ) : claimItem.status === 'Rejected' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400 bg-rose-950/80 border border-rose-800/50 px-2.5 py-1 rounded-full">
                            Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-950/80 border border-amber-800/50 px-2.5 py-1 rounded-full">
                            Pending Payout
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-xs font-mono text-emerald-400">
                        {claimItem.transactionRef || '-'}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => handleOpenClaimEditModal(claimItem)}
                          className="p-2 text-amber-400 hover:text-white hover:bg-amber-600/30 rounded-lg transition-colors cursor-pointer"
                          title="Process Payout Transfer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* UPDATE LEAD MODAL */}
      {editingReferral && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 text-slate-100 rounded-2xl w-full max-w-md shadow-2xl border border-slate-700/80 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-sky-400" /> Update Referral Lead Status
              </h3>
              <button
                onClick={() => setEditingReferral(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <span className="text-xs text-slate-400 block">Referrer Customer</span>
                <span className="text-sm font-bold text-white">{editingReferral.referrerId?.name} ({editingReferral.referralCode})</span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block">Referred Friend & Interest</span>
                <span className="text-sm font-bold text-sky-400">{editingReferral.refereeName} ({editingReferral.refereePhone})</span>
                <span className="text-xs text-slate-300 block">Product: {editingReferral.productName}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Pipeline Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                >
                  <option value="Pending">Pending Contact</option>
                  <option value="Contacted">Contacted by Sales Agent</option>
                  <option value="Purchased">Purchased / Deal Converted</option>
                  <option value="Reward Credited">Reward Credited & Released</option>
                  <option value="Rejected">Rejected / Not Interested</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Final Sale Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 35000"
                    value={formData.purchaseAmount}
                    onChange={(e) => setFormData({ ...formData, purchaseAmount: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Reward Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 1000"
                    value={formData.rewardAmount}
                    onChange={(e) => setFormData({ ...formData, rewardAmount: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Invoice #1049 paid on 12-Aug."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingReferral(null)}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-sky-600 text-white rounded-xl text-xs font-bold hover:bg-sky-500 shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Updating...' : 'Save Lead Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE PAYOUT CLAIM MODAL */}
      {editingClaim && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 text-slate-100 rounded-2xl w-full max-w-md shadow-2xl border border-amber-500/40 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-400" /> Process Customer Payout Transfer
              </h3>
              <button
                onClick={() => setEditingClaim(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateClaimSubmit} className="space-y-4">
              <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl">
                <span className="text-xs text-slate-400 block">Customer Name & Phone</span>
                <span className="text-sm font-bold text-white">{editingClaim.userName} ({editingClaim.userPhone})</span>
                <span className="text-xs text-amber-400 font-bold block mt-1">Claim Amount: ₹{editingClaim.amount.toLocaleString()}</span>
                <span className="text-xs text-slate-300 font-mono block mt-1">Method ({editingClaim.payoutMethod}): {editingClaim.payoutDetails}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Claim Payout Status *</label>
                <select
                  value={claimFormData.status}
                  onChange={(e) => setClaimFormData({ ...claimFormData, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  <option value="Paid">Mark as Paid & Transferred</option>
                  <option value="Approved">Approved (Queued for Payment)</option>
                  <option value="Pending">Pending Verification</option>
                  <option value="Rejected">Reject Claim Request</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Transaction Ref / UTR / URN #</label>
                <input
                  type="text"
                  placeholder="e.g. UPI/423984920193"
                  value={claimFormData.transactionRef}
                  onChange={(e) => setClaimFormData({ ...claimFormData, transactionRef: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Transferred ₹1000 via GooglePay on 13-Aug."
                  value={claimFormData.adminNotes}
                  onChange={(e) => setClaimFormData({ ...claimFormData, adminNotes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingClaim(null)}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={claimSubmitting}
                  className="px-5 py-2.5 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-500 shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {claimSubmitting ? 'Updating...' : 'Save Payout Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminReferralsTab;
