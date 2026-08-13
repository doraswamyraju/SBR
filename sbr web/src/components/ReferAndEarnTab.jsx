import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  Gift, 
  Share2, 
  Copy, 
  Check, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Plus, 
  X, 
  CheckCircle, 
  Sparkles,
  PhoneCall,
  ShoppingBag,
  CreditCard,
  Send,
  AlertCircle,
  History
} from 'lucide-react';

const ReferAndEarnTab = () => {
  const [referralData, setReferralData] = useState({
    referralCode: '',
    totalInvited: 0,
    convertedCount: 0,
    totalEarnings: 0,
    claimedEarnings: 0,
    availableBalance: 0,
    pendingEarnings: 0,
    referrals: [],
    claims: []
  });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Referral Lead Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    refereeName: '',
    refereePhone: '',
    productId: '',
    productName: '',
    notes: ''
  });

  // Claim Payout Modal
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState('');
  const [claimError, setClaimError] = useState('');

  const [claimData, setClaimData] = useState({
    amount: 500,
    payoutMethod: 'UPI',
    payoutDetails: ''
  });

  useEffect(() => {
    fetchReferralData();
    fetchProducts();
  }, []);

  const fetchReferralData = async () => {
    setLoading(true);
    try {
      const res = await api.get('api/referrals/my-referrals');
      if (res.success && res.data) {
        setReferralData(res.data);
        if (res.data.availableBalance >= 500) {
          setClaimData(prev => ({ ...prev, amount: res.data.availableBalance }));
        }
      }
    } catch (err) {
      setError('Failed to load referral details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('api/products');
      if (res.success && res.data) {
        setProducts(res.data);
        if (res.data.length > 0) {
          setFormData(prev => ({
            ...prev,
            productId: res.data[0]._id,
            productName: res.data[0].name
          }));
        }
      }
    } catch (err) {
      console.log('Error fetching products list');
    }
  };

  const handleCopyCode = () => {
    if (!referralData.referralCode) return;
    navigator.clipboard.writeText(referralData.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleWhatsAppShare = () => {
    const code = referralData.referralCode || 'SBR-PROMO';
    const message = encodeURIComponent(
      `Hey! Check out Sri Balaji Renewables for high-efficiency solar water heaters, solar power systems & water softeners in Tirupati! Use my referral code *${code}* when ordering to get special partner support. Visit: https://sbr.sriddha.com`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const selectedProductObj = products.find(p => p._id === formData.productId || p.name === formData.productName);

  const calculateEstimatedReward = () => {
    if (!selectedProductObj) return '₹500';
    if (selectedProductObj.commissionType === 'percentage') {
      const reward = Math.round((selectedProductObj.basePrice * (selectedProductObj.commissionValue || 0)) / 100);
      return `~₹${reward.toLocaleString()} (${selectedProductObj.commissionValue}% Bonus)`;
    }
    return `₹${selectedProductObj.commissionValue?.toLocaleString() || 500} Flat`;
  };

  const handleProductSelect = (e) => {
    const pId = e.target.value;
    const prod = products.find(p => p._id === pId);
    setFormData(prev => ({
      ...prev,
      productId: pId,
      productName: prod ? prod.name : ''
    }));
  };

  const handleSubmitReferral = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    setFormSuccess('');

    try {
      const res = await api.post('api/referrals/submit', formData);
      if (res.success) {
        setFormSuccess('Referral lead submitted successfully! Our sales team will reach out.');
        setFormData({
          refereeName: '',
          refereePhone: '',
          productId: products[0]?._id || '',
          productName: products[0]?.name || '',
          notes: ''
        });
        fetchReferralData();
        setTimeout(() => {
          setIsModalOpen(false);
          setFormSuccess('');
        }, 2000);
      } else {
        setFormError(res.error || 'Failed to submit referral lead.');
      }
    } catch (err) {
      setFormError('Error submitting referral');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    setClaimSubmitting(true);
    setClaimError('');
    setClaimSuccess('');

    const numAmt = Number(claimData.amount);
    if (numAmt < 500) {
      setClaimError('Minimum claim amount is ₹500.');
      setClaimSubmitting(false);
      return;
    }

    if (numAmt > referralData.availableBalance) {
      setClaimError(`Cannot claim more than available balance (₹${referralData.availableBalance.toLocaleString()})`);
      setClaimSubmitting(false);
      return;
    }

    try {
      const res = await api.post('api/referrals/claim-payout', claimData);
      if (res.success) {
        setClaimSuccess('Payout claim request submitted! Our admin team will verify and transfer funds.');
        fetchReferralData();
        setTimeout(() => {
          setIsClaimModalOpen(false);
          setClaimSuccess('');
        }, 2500);
      } else {
        setClaimError(res.error || 'Failed to submit claim request.');
      }
    } catch (err) {
      setClaimError('Error submitting claim request');
    } finally {
      setClaimSubmitting(false);
    }
  };

  const availableForClaim = (referralData.availableBalance || 0) >= 500;

  return (
    <div className="space-y-6 text-slate-100">

      {/* Hero Banner */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-sky-900 via-blue-900 to-indigo-950 border border-sky-700/50 shadow-2xl">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-sky-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 text-xs font-bold uppercase tracking-wider mb-3">
              <Gift className="w-4 h-4 text-sky-400" /> SBR Rewards Program
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              Refer Friends & Earn Cash Rewards
            </h2>
            <p className="text-sm text-sky-100/80 mt-2 leading-relaxed">
              Share your referral code or enter friend details. Request direct payout transfers to your UPI / Bank once your earnings reach ₹500!
            </p>

            {/* Claim Earnings Highlight */}
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => setIsClaimModalOpen(true)}
                disabled={!availableForClaim}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all cursor-pointer ${
                  availableForClaim 
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-amber-500/20' 
                    : 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed opacity-80'
                }`}
              >
                <DollarSign className="w-4 h-4" /> 
                {availableForClaim 
                  ? `Claim Reward Payout (₹${referralData.availableBalance.toLocaleString()} Available)` 
                  : `Claim Reward (Min ₹500 Required)`}
              </button>
            </div>
          </div>

          {/* Referral Code & Action Box */}
          <div className="w-full md:w-auto bg-slate-900/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-sky-500/30 space-y-3 flex-shrink-0">
            <span className="text-xs font-semibold text-sky-300 block uppercase tracking-wider">Your Unique Referral Code</span>
            
            <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-700">
              <span className="text-lg font-black tracking-wider text-amber-400 font-mono px-2">
                {referralData.referralCode || 'GENERATING...'}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Copy Code"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleWhatsAppShare}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-lg transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" /> Share WhatsApp
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-lg transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Refer Friend
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700/60 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-950/80 border border-sky-800/50 flex items-center justify-center text-sky-400 flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Total Invited</span>
            <span className="text-xl font-extrabold text-white">{referralData.totalInvited}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700/60 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-800/50 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Converted Sales</span>
            <span className="text-xl font-extrabold text-emerald-400">{referralData.convertedCount}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700/60 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-800/50 flex items-center justify-center text-amber-400 flex-shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Available to Claim</span>
            <span className="text-xl font-extrabold text-amber-400">₹{(referralData.availableBalance || 0).toLocaleString()}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700/60 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-950/80 border border-purple-800/50 flex items-center justify-center text-purple-400 flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Pending Pipeline</span>
            <span className="text-xl font-extrabold text-purple-300">₹{(referralData.pendingEarnings || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Referrals Pipeline Table */}
      <div className="rounded-2xl bg-slate-800/70 border border-slate-700/60 shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-700/80 flex items-center justify-between">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-sky-400" /> My Submitted Referrals
          </h3>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Submit Lead
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="animate-spin w-8 h-8 border-4 border-sky-400 border-t-transparent rounded-full mx-auto mb-3"></div>
            Loading referral records...
          </div>
        ) : referralData.referrals.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Gift className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-sm font-medium">You haven't submitted any referrals yet.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-sky-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-sky-500 cursor-pointer"
            >
              Refer Your First Friend
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-700/80 text-slate-300 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-4 px-4">Friend Details</th>
                  <th className="py-4 px-4">Product Interest</th>
                  <th className="py-4 px-4">Date Submitted</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-right">Estimated Reward</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {referralData.referrals.map((ref) => (
                  <tr key={ref._id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-bold text-white">{ref.refereeName}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <PhoneCall className="w-3 h-3 text-sky-400" /> {ref.refereePhone}
                      </div>
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-200">
                      <span className="px-2.5 py-1 bg-sky-950/80 text-sky-300 border border-sky-800/50 rounded-lg text-xs font-semibold">
                        {ref.productName}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-400">
                      {new Date(ref.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-4">
                      {ref.status === 'Reward Credited' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800/50 px-2.5 py-1 rounded-full">
                          <CheckCircle className="w-3.5 h-3.5" /> Reward Credited
                        </span>
                      ) : ref.status === 'Purchased' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 bg-sky-950/80 border border-sky-800/50 px-2.5 py-1 rounded-full">
                          <Sparkles className="w-3.5 h-3.5" /> Converted
                        </span>
                      ) : ref.status === 'Contacted' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-950/80 border border-amber-800/50 px-2.5 py-1 rounded-full">
                          Contacted
                        </span>
                      ) : ref.status === 'Rejected' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 bg-rose-950/80 border border-rose-800/50 px-2.5 py-1 rounded-full">
                          Closed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-300 bg-purple-950/80 border border-purple-800/50 px-2.5 py-1 rounded-full">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right font-extrabold text-amber-400">
                      ₹{ref.rewardAmount?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payout Claims History */}
      {referralData.claims && referralData.claims.length > 0 && (
        <div className="rounded-2xl bg-slate-800/70 border border-slate-700/60 shadow-xl overflow-hidden">
          <div className="p-5 border-b border-slate-700/80 flex items-center justify-between">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <History className="w-5 h-5 text-amber-400" /> Payout Withdrawal History
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-700/80 text-slate-300 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-4 px-4">Date</th>
                  <th className="py-4 px-4">Method & Details</th>
                  <th className="py-4 px-4">Amount</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-right">Ref / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {referralData.claims.map((claim) => (
                  <tr key={claim._id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-4 px-4 text-xs text-slate-400">
                      {new Date(claim.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-200">
                      <span className="text-xs text-sky-400 font-mono block">{claim.payoutMethod}</span>
                      <span>{claim.payoutDetails}</span>
                    </td>
                    <td className="py-4 px-4 font-extrabold text-amber-400">
                      ₹{claim.amount.toLocaleString()}
                    </td>
                    <td className="py-4 px-4">
                      {claim.status === 'Paid' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800/50 px-2.5 py-1 rounded-full">
                          <CheckCircle className="w-3 h-3" /> Transferred & Paid
                        </span>
                      ) : claim.status === 'Approved' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 bg-sky-950/80 border border-sky-800/50 px-2.5 py-1 rounded-full">
                          Approved
                        </span>
                      ) : claim.status === 'Rejected' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400 bg-rose-950/80 border border-rose-800/50 px-2.5 py-1 rounded-full">
                          Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-950/80 border border-amber-800/50 px-2.5 py-1 rounded-full">
                          Pending Admin Transfer
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right text-xs text-slate-400">
                      {claim.transactionRef ? (
                        <span className="font-mono text-emerald-400">Ref: {claim.transactionRef}</span>
                      ) : claim.adminNotes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REFER A FRIEND MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 text-slate-100 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-700/80 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Gift className="w-5 h-5 text-sky-400" /> Refer a Friend to SBR
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formSuccess && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            {formError && (
              <div className="p-3 bg-rose-950/80 border border-rose-700/50 text-rose-300 rounded-xl text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitReferral} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Friend's Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={formData.refereeName}
                  onChange={(e) => setFormData({ ...formData, refereeName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Friend's Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 98765 43210"
                  value={formData.refereePhone}
                  onChange={(e) => setFormData({ ...formData, refereePhone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Product Interest *</label>
                <select
                  value={formData.productId}
                  onChange={handleProductSelect}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                >
                  {products.map(prod => (
                    <option key={prod._id} value={prod._id}>
                      {prod.name} (Price: ₹{prod.basePrice?.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3.5 bg-sky-950/50 border border-sky-800/60 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-sky-300 block uppercase tracking-wider">Estimated Referral Payout</span>
                  <span className="text-base font-extrabold text-amber-400">{calculateEstimatedReward()}</span>
                </div>
                <Sparkles className="w-6 h-6 text-amber-400" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Additional Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Planning installation in Indiranagar next month..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-sky-600 text-white rounded-xl text-xs font-bold hover:bg-sky-500 shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Submitting Lead...' : 'Submit Referral Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLAIM PAYOUT MODAL */}
      {isClaimModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 text-slate-100 rounded-2xl w-full max-w-md shadow-2xl border border-amber-500/40 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-400" /> Request Reward Payout Transfer
              </h3>
              <button
                onClick={() => setIsClaimModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {claimSuccess && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{claimSuccess}</span>
              </div>
            )}

            {claimError && (
              <div className="p-3 bg-rose-950/80 border border-rose-700/50 text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{claimError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitClaim} className="space-y-4">
              <div className="p-3.5 bg-amber-950/40 border border-amber-800/60 rounded-xl">
                <span className="text-xs text-amber-300 block font-medium">Available Balance for Payout</span>
                <span className="text-xl font-extrabold text-amber-400">₹{(referralData.availableBalance || 0).toLocaleString()}</span>
                <span className="text-[11px] text-slate-400 block mt-1">Minimum payout threshold: ₹500</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Claim Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="500"
                  max={referralData.availableBalance}
                  value={claimData.amount}
                  onChange={(e) => setClaimData({ ...claimData, amount: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-extrabold text-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Payout Transfer Method *</label>
                <select
                  value={claimData.payoutMethod}
                  onChange={(e) => setClaimData({ ...claimData, payoutMethod: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  <option value="UPI">UPI ID / GPay / PhonePe / Paytm</option>
                  <option value="Bank Transfer">Bank Account Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {claimData.payoutMethod === 'UPI' ? 'Enter UPI ID / Mobile Number *' : 'Enter Bank Account No, Name & IFSC Code *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={claimData.payoutMethod === 'UPI' ? 'e.g. 9876543210@paytm or john@upi' : 'e.g. A/C: 123456789, IFSC: SBIN0001234, Name: John'}
                  value={claimData.payoutDetails}
                  onChange={(e) => setClaimData({ ...claimData, payoutDetails: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsClaimModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={claimSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 rounded-xl text-xs font-extrabold shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {claimSubmitting ? 'Submitting Request...' : 'Submit Claim Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ReferAndEarnTab;
