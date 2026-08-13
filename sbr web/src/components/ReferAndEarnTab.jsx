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
  ExternalLink
} from 'lucide-react';

const ReferAndEarnTab = () => {
  const [referralData, setReferralData] = useState({
    referralCode: '',
    totalInvited: 0,
    convertedCount: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
    referrals: []
  });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Referral Submission Modal
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

  // Selected product object for payout preview
  const selectedProductObj = products.find(p => p._id === formData.productId || p.name === formData.productName);

  const calculateEstimatedReward = () => {
    if (!selectedProductObj) return '₹500';
    if (selectedProductObj.commissionType === 'percentage') {
      const reward = Math.round((selectedProductObj.basePrice * selectedProductProductValue(selectedProductObj)) / 100);
      return `~₹${reward.toLocaleString()} (${selectedProductObj.commissionValue}% Bonus)`;
    }
    return `₹${selectedProductObj.commissionValue?.toLocaleString() || 500} Flat`;
  };

  const selectedProductProductValue = (prod) => prod.commissionValue || 0;

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

  return (
    <div className="space-y-6 text-slate-100">

      {/* Hero Banner: Referral Code & WhatsApp Share */}
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
              Share your unique referral code or directly submit friends' details for solar & water systems. Earn up to 5% commission on converted orders!
            </p>
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
                <Share2 className="w-4 h-4" /> Share on WhatsApp
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-lg transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Refer a Friend
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary Cards */}
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
            <span className="text-xs text-slate-400 font-medium block">Total Earnings</span>
            <span className="text-xl font-extrabold text-amber-400">₹{referralData.totalEarnings?.toLocaleString()}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700/60 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-950/80 border border-purple-800/50 flex items-center justify-center text-purple-400 flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Pending Earnings</span>
            <span className="text-xl font-extrabold text-purple-300">₹{referralData.pendingEarnings?.toLocaleString()}</span>
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

              {/* Dynamic Estimated Payout Box */}
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
    </div>
  );
};

export default ReferAndEarnTab;
