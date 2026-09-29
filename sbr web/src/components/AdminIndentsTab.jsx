import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  Package, 
  CheckCircle, 
  Clock, 
  XCircle, 
  RefreshCw, 
  Truck, 
  Search, 
  Plus, 
  Check, 
  X, 
  AlertTriangle, 
  Layers,
  ArrowRight,
  Filter
} from 'lucide-react';

const AdminIndentsTab = () => {
  const [activeSubTab, setActiveSubTab] = useState('pending'); // 'pending', 'history', 'van-stock'
  const [pendingIndents, setPendingIndents] = useState([]);
  const [allIndents, setAllIndents] = useState([]);
  const [agents, setAgents] = useState([]);
  const [agentInventories, setAgentInventories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals & Action States
  const [selectedIndentForDispatch, setSelectedIndentForDispatch] = useState(null);
  const [dispatchQuantities, setDispatchQuantities] = useState({});
  const [dispatchRemarks, setDispatchRemarks] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);

  const [selectedIndentForReject, setSelectedIndentForReject] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferData, setTransferData] = useState({
    agentId: '',
    productId: '',
    quantity: 1,
    remarks: ''
  });
  const [isTransferring, setIsTransferring] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedAgentForKit, setSelectedAgentForKit] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [pendingRes, allRes, usersRes, invRes, prodRes] = await Promise.all([
        api.get('api/indents/pending').catch(() => ({ success: true, data: [] })),
        api.get('api/indents/all').catch(() => ({ success: true, data: [] })),
        api.get('api/users').catch(() => ({ success: true, data: [] })),
        api.get('api/agent-inventory/all').catch(() => ({ success: true, data: [] })),
        api.get('api/products').catch(() => ({ success: true, data: [] }))
      ]);

      if (pendingRes.success) setPendingIndents(pendingRes.data || []);
      if (allRes.success) setAllIndents(allRes.data || []);
      if (usersRes.success) {
        const agentList = (usersRes.data || []).filter(u => String(u.role).toUpperCase() === 'AGENT');
        setAgents(agentList);
      }
      if (invRes.success) setAgentInventories(invRes.data || []);
      if (prodRes.success) setProducts(prodRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch inventory and indent data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openDispatchModal = (indent) => {
    setSelectedIndentForDispatch(indent);
    const initialQtys = {};
    (indent.items || []).forEach(it => {
      initialQtys[it.productName] = it.requestedQuantity;
    });
    setDispatchQuantities(initialQtys);
    setDispatchRemarks('Approved and dispatched by Admin');
  };

  const handleConfirmDispatch = async () => {
    if (!selectedIndentForDispatch) return;
    setIsDispatching(true);
    try {
      const res = await api.post(`api/indents/${selectedIndentForDispatch._id}/dispatch`, {
        inchargeRemarks: dispatchRemarks,
        itemQuantities: dispatchQuantities
      });
      if (res.success) {
        setSuccessMsg('Indent dispatched successfully and technician van kit credited!');
        setSelectedIndentForDispatch(null);
        await fetchData();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      alert(err.message || 'Failed to dispatch indent');
    } finally {
      setIsDispatching(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedIndentForReject) return;
    setIsRejecting(true);
    try {
      const res = await api.post(`api/indents/${selectedIndentForReject._id}/reject`, {
        inchargeRemarks: rejectReason || 'Stock unavailable / Rejected by Admin'
      });
      if (res.success) {
        setSuccessMsg('Indent rejected.');
        setSelectedIndentForReject(null);
        setRejectReason('');
        await fetchData();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      alert(err.message || 'Failed to reject indent');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleDirectTransfer = async (e) => {
    e.preventDefault();
    if (!transferData.agentId || !transferData.productId || transferData.quantity <= 0) {
      alert('Please fill all required fields');
      return;
    }
    setIsTransferring(true);
    try {
      const res = await api.post('api/agent-inventory/transfer', transferData);
      if (res.success) {
        setSuccessMsg('Stock transferred directly to technician van kit!');
        setShowTransferModal(false);
        setTransferData({ agentId: '', productId: '', quantity: 1, remarks: '' });
        await fetchData();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      alert(err.message || 'Failed to transfer stock');
    } finally {
      setIsTransferring(false);
    }
  };

  const filteredHistory = allIndents.filter(ind => {
    const matchesStatus = statusFilter === 'All' || ind.status === statusFilter;
    const matchesAgent = !selectedAgentForKit || ind.agentId?._id === selectedAgentForKit;
    const matchesSearch = !searchQuery || 
      (ind.agentId?.name && ind.agentId.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ind.items && ind.items.some(it => it.productName && it.productName.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesStatus && matchesAgent && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-600" />
            <span>Agent Parts Indents & Van Stock Kits</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Review technician parts requisitions, approve dispatch with auto-inventory adjustment, and audit vehicle kits.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowTransferModal(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Direct Stock Allocation
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Success / Error Alerts */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-700"><X size={16} /></button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700"><X size={16} /></button>
        </div>
      )}

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Indents</p>
            <p className="text-2xl font-black text-rose-600 mt-1">{pendingIndents.length}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Awaiting store approval</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Field Agents</p>
            <p className="text-2xl font-black text-indigo-600 mt-1">{agents.length}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Active service technicians</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Van Stock Items</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {agentInventories.reduce((acc, it) => acc + (it.quantity || 0), 0)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Units across all mobile kits</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Layers className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-4 pt-2">
        <button
          onClick={() => setActiveSubTab('pending')}
          className={`px-5 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'pending'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Pending Indents Queue</span>
          {pendingIndents.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-rose-100 text-rose-700 font-extrabold">
              {pendingIndents.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('history')}
          className={`px-5 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'history'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          <span>Indents History ({allIndents.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('van-stock')}
          className={`px-5 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'van-stock'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Technician Van Stock Audit</span>
        </button>
      </div>

      {/* SUB-TAB 1: PENDING INDENTS */}
      {activeSubTab === 'pending' && (
        <div className="bg-white rounded-b-2xl border border-t-0 border-slate-200 p-6 shadow-sm">
          {loading ? (
            <div className="text-center py-12 text-slate-500 text-sm">Loading requisition indents...</div>
          ) : pendingIndents.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="font-bold text-slate-700 text-base">No Pending Indents</p>
              <p className="text-xs text-slate-400 mt-0.5">All field technician spare parts requisitions have been fulfilled.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {pendingIndents.map(indent => (
                <div 
                  key={indent._id}
                  className="p-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                          Agent: {indent.agentId?.name || 'Technician'}
                        </span>
                        {indent.agentId?.phone && (
                          <p className="text-xs text-slate-500 mt-1.5">📞 {indent.agentId.phone}</p>
                        )}
                        {indent.serviceRequestId && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            Ticket: #{String(indent.serviceRequestId._id || indent.serviceRequestId).slice(-6).toUpperCase()} ({indent.serviceRequestId.serviceType})
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(indent.requestedAt || indent.createdAt).toLocaleString()}
                      </span>
                    </div>

                    {indent.agentRemarks && (
                      <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-700 mb-3 italic">
                        "{indent.agentRemarks}"
                      </div>
                    )}

                    <div className="space-y-2 mb-4">
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Requested Spare Parts:</p>
                      {(indent.items || []).map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs bg-white p-2.5 rounded-xl border border-slate-200">
                          <div>
                            <span className="font-semibold text-slate-800">{it.productName}</span>
                            {it.sku && <span className="text-slate-400 ml-1.5">({it.sku})</span>}
                          </div>
                          <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg">
                            {it.requestedQuantity} unit(s)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-3 border-t border-slate-200">
                    <button
                      onClick={() => {
                        setSelectedIndentForReject(indent);
                        setRejectReason('');
                      }}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => openDispatchModal(indent)}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs shadow-md transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve & Dispatch Stock</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: INDENTS HISTORY */}
      {activeSubTab === 'history' && (
        <div className="bg-white rounded-b-2xl border border-t-0 border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by agent or part name..."
                className="w-full pl-9 pr-4 py-2 border rounded-xl text-xs bg-slate-50 focus:bg-white"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-xl text-xs bg-white"
              >
                <option value="All">All Statuses</option>
                <option value="REQUESTED">Requested (Pending)</option>
                <option value="DISPATCHED">Dispatched (Approved)</option>
                <option value="REJECTED">Rejected</option>
              </select>

              <select
                value={selectedAgentForKit}
                onChange={(e) => setSelectedAgentForKit(e.target.value)}
                className="px-3 py-2 border rounded-xl text-xs bg-white"
              >
                <option value="">All Field Agents</option>
                {agents.map(a => (
                  <option key={a._id} value={a._id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 text-xs">Date</th>
                  <th className="py-3 px-4 text-xs">Technician</th>
                  <th className="py-3 px-4 text-xs">Requested Items</th>
                  <th className="py-3 px-4 text-xs">Dispatched Qty</th>
                  <th className="py-3 px-4 text-xs">Status</th>
                  <th className="py-3 px-4 text-xs">Admin / Store Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                      No indents found matching filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map(ind => (
                    <tr key={ind._id} className="hover:bg-slate-50 text-xs">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(ind.requestedAt || ind.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {ind.agentId?.name || 'Technician'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {(ind.items || []).map((it, idx) => (
                            <div key={idx} className="text-slate-700">
                              <span className="font-semibold">{it.productName}</span> ({it.requestedQuantity} requested)
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {(ind.items || []).map(it => it.dispatchedQuantity || 0).reduce((a, b) => a + b, 0)} units
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          ind.status === 'DISPATCHED' ? 'bg-emerald-100 text-emerald-800' :
                          ind.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {ind.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 italic">
                        {ind.inchargeRemarks || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: VAN STOCK AUDIT */}
      {activeSubTab === 'van-stock' && (
        <div className="bg-white rounded-b-2xl border border-t-0 border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h3 className="text-sm font-bold text-slate-800">Field Agent Van Kit Stock Levels</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Filter by Agent:</span>
              <select
                value={selectedAgentForKit}
                onChange={(e) => setSelectedAgentForKit(e.target.value)}
                className="px-3 py-1.5 border rounded-xl text-xs bg-white"
              >
                <option value="">All Field Agents</option>
                {agents.map(a => (
                  <option key={a._id} value={a._id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 text-xs">Technician</th>
                  <th className="py-3 px-4 text-xs">Part / Spare Name</th>
                  <th className="py-3 px-4 text-xs">SKU</th>
                  <th className="py-3 px-4 text-xs">Qty in Van</th>
                  <th className="py-3 px-4 text-xs">Status</th>
                  <th className="py-3 px-4 text-xs">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agentInventories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                      No technician van kit records found.
                    </td>
                  </tr>
                ) : (
                  agentInventories
                    .filter(inv => !selectedAgentForKit || inv.agentId?._id === selectedAgentForKit)
                    .map(inv => (
                      <tr key={inv._id} className="hover:bg-slate-50 text-xs">
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {inv.agentId?.name || 'Technician'}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{inv.productName}</td>
                        <td className="py-3 px-4 text-slate-400">{inv.sku || '-'}</td>
                        <td className="py-3 px-4 font-black text-slate-900">{inv.quantity}</td>
                        <td className="py-3 px-4">
                          {inv.quantity <= (inv.minThreshold || 1) ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              Low Stock (≤{inv.minThreshold || 1})
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {inv.lastUpdated ? new Date(inv.lastUpdated).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DISPATCH CONFIRMATION MODAL */}
      {selectedIndentForDispatch && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>Approve & Dispatch Indent</span>
              </h3>
              <button onClick={() => setSelectedIndentForDispatch(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Dispatching stock for technician <strong className="text-slate-800">{selectedIndentForDispatch.agentId?.name}</strong>. Central inventory will be auto-debited and technician van kit will be auto-credited.
              </p>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl">
              <p className="text-xs font-bold text-slate-700">Set Dispatched Quantities:</p>
              {(selectedIndentForDispatch.items || []).map((it, idx) => (
                <div key={idx} className="flex justify-between items-center gap-3">
                  <span className="text-xs font-medium text-slate-800">{it.productName}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Req: {it.requestedQuantity}</span>
                    <input
                      type="number"
                      min="0"
                      value={dispatchQuantities[it.productName] ?? it.requestedQuantity}
                      onChange={(e) => setDispatchQuantities({
                        ...dispatchQuantities,
                        [it.productName]: Number(e.target.value)
                      })}
                      className="w-20 px-2.5 py-1 border rounded-lg text-xs font-bold text-center bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Store / Admin Remarks</label>
              <input
                type="text"
                value={dispatchRemarks}
                onChange={(e) => setDispatchRemarks(e.target.value)}
                placeholder="e.g. Dispatched via Morning Slot"
                className="w-full px-3 py-2 border rounded-xl text-xs bg-slate-50 focus:bg-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedIndentForDispatch(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDispatch}
                disabled={isDispatching}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                {isDispatching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Confirm Dispatch</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {selectedIndentForReject && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                <span>Reject Indent Request</span>
              </h3>
              <button onClick={() => setSelectedIndentForReject(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Please enter the reason for rejecting this requisition from <strong>{selectedIndentForReject.agentId?.name}</strong>.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Rejection Reason</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Spare part currently out of stock in warehouse."
                rows={3}
                className="w-full px-3 py-2 border rounded-xl text-xs bg-slate-50 focus:bg-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedIndentForReject(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isRejecting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md"
              >
                {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIRECT VAN STOCK TRANSFER MODAL */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-600" />
                <span>Direct Van Stock Allocation</span>
              </h3>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleDirectTransfer} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Field Technician *</label>
                <select
                  required
                  value={transferData.agentId}
                  onChange={(e) => setTransferData({ ...transferData, agentId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                >
                  <option value="">-- Choose Agent --</option>
                  {agents.map(a => (
                    <option key={a._id} value={a._id}>{a.name} ({a.phone || a.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Spare Part / Product *</label>
                <select
                  required
                  value={transferData.productId}
                  onChange={(e) => setTransferData({ ...transferData, productId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                >
                  <option value="">-- Choose Product --</option>
                  {products.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.name} (In Store Stock: {p.stockLevel !== undefined ? p.stockLevel : 'N/A'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Quantity to Allocate *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={transferData.quantity}
                  onChange={(e) => setTransferData({ ...transferData, quantity: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-slate-50 focus:bg-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Allocation Remarks (Optional)</label>
                <input
                  type="text"
                  value={transferData.remarks}
                  onChange={(e) => setTransferData({ ...transferData, remarks: e.target.value })}
                  placeholder="e.g. Morning Van Kit Refill"
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTransferring}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
                >
                  {isTransferring ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Allocate Stock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminIndentsTab;
