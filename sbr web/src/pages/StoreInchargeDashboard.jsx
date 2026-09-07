import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import {
  Truck,
  CheckCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  UserCheck,
  RefreshCw,
  LogOut,
  ChevronRight,
  Filter,
  FileText,
  Users,
  Search,
  Check,
  X,
  Package,
  Send,
  Plus
} from 'lucide-react';
import './Dashboard.css';

const StoreInchargeDashboard = ({ initialTab, handleNavigation }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab || 'dispatch');

  // Service Requests state
  const [requests, setRequests] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [requestFilter, setRequestFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Cash Handovers state
  const [pendingHandovers, setPendingHandovers] = useState([]);
  const [allHandovers, setAllHandovers] = useState([]);
  const [loadingHandovers, setLoadingHandovers] = useState(true);
  const [handoverFilter, setHandoverFilter] = useState('ALL');

  // Indents & Van Kits state
  const [pendingIndents, setPendingIndents] = useState([]);
  const [allIndents, setAllIndents] = useState([]);
  const [agentInventories, setAgentInventories] = useState([]);
  const [loadingIndents, setLoadingIndents] = useState(true);
  const [selectedAgentForKit, setSelectedAgentForKit] = useState('');

  // Transfer stock modal state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferAgentId, setTransferAgentId] = useState('');
  const [transferProductName, setTransferProductName] = useState('');
  const [transferSku, setTransferSku] = useState('');
  const [transferQty, setTransferQty] = useState(5);
  const [transferLoading, setTransferLoading] = useState(false);

  // Acknowledgment Modal state
  const [selectedHandover, setSelectedHandover] = useState(null);
  const [receivedAmount, setReceivedAmount] = useState('');
  const [inchargeNotes, setInchargeNotes] = useState('');
  const [processingHandover, setProcessingHandover] = useState(false);
  const [handoverError, setHandoverError] = useState('');

  // Assign request modal/state
  const [assigningRequestId, setAssigningRequestId] = useState(null);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const switchTab = (tabName) => {
    setActiveTab(tabName);
    handleNavigation({ pageId: 'store-incharge-dashboard', tab: tabName });
  };

  // Fetch Requests & Agents
  const fetchRequestsAndAgents = async () => {
    setLoadingRequests(true);
    try {
      const [reqRes, usersRes] = await Promise.all([
        api.get('api/requests'),
        api.get('api/users')
      ]);

      if (reqRes.success) {
        setRequests(reqRes.data || []);
      }
      if (usersRes.success) {
        const agentList = (usersRes.data || []).filter(u => u.role === 'AGENT');
        setAgents(agentList);
      }
    } catch (err) {
      console.error('Failed to load dispatch data:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Fetch Handovers
  const fetchHandovers = async () => {
    setLoadingHandovers(true);
    try {
      const [pendingRes, allRes] = await Promise.all([
        api.get('api/handovers/pending'),
        api.get('api/handovers/all')
      ]);

      if (pendingRes.success) {
        setPendingHandovers(pendingRes.data || []);
      }
      if (allRes.success) {
        setAllHandovers(allRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load handovers:', err);
    } finally {
      setLoadingHandovers(false);
    }
  };

  // Fetch Indents & Van Kits
  const fetchIndentsAndKits = async () => {
    setLoadingIndents(true);
    try {
      const [pendingIndRes, allIndRes, invRes] = await Promise.all([
        api.get('api/indents/pending'),
        api.get('api/indents/all'),
        api.get('api/agent-inventory/all')
      ]);

      if (pendingIndRes.success) setPendingIndents(pendingIndRes.data || []);
      if (allIndRes.success) setAllIndents(allIndRes.data || []);
      if (invRes.success) setAgentInventories(invRes.data || []);
    } catch (err) {
      console.error('Failed to load indents and kits:', err);
    } finally {
      setLoadingIndents(false);
    }
  };

  useEffect(() => {
    fetchRequestsAndAgents();
    fetchHandovers();
    fetchIndentsAndKits();
  }, []);

  // Handle Indent Dispatch
  const handleDispatchIndent = async (indentId, remarks = '') => {
    try {
      const res = await api.post(`api/indents/${indentId}/dispatch`, { inchargeRemarks: remarks });
      if (res.success) {
        alert('Indent dispatched and agent kit updated!');
        await fetchIndentsAndKits();
      }
    } catch (err) {
      alert(err.message || 'Failed to dispatch indent');
    }
  };

  // Handle Indent Reject
  const handleRejectIndent = async (indentId, remarks = '') => {
    const reason = prompt('Please enter rejection reason:', remarks || 'Out of stock at central store');
    if (reason === null) return;
    try {
      const res = await api.post(`api/indents/${indentId}/reject`, { inchargeRemarks: reason });
      if (res.success) {
        await fetchIndentsAndKits();
      }
    } catch (err) {
      alert(err.message || 'Failed to reject indent');
    }
  };

  // Handle Direct Van Stock Transfer
  const handleTransferStockSubmit = async (e) => {
    e.preventDefault();
    if (!transferAgentId || !transferProductName || transferQty <= 0) return;
    setTransferLoading(true);
    try {
      const res = await api.post('api/agent-inventory/transfer', {
        agentId: transferAgentId,
        productName: transferProductName,
        sku: transferSku,
        quantity: Number(transferQty)
      });
      if (res.success) {
        alert(res.message);
        setShowTransferModal(false);
        setTransferProductName('');
        setTransferSku('');
        setTransferQty(5);
        await fetchIndentsAndKits();
      }
    } catch (err) {
      alert(err.message || 'Failed to transfer stock');
    } finally {
      setTransferLoading(false);
    }
  };

  // Handle Request Assignment
  const handleAssignAgent = async (requestId, agentId) => {
    if (!agentId) return;
    setAssignLoading(true);
    try {
      const res = await api.put(`api/requests/${requestId}/assign`, { agentId });
      if (res.success) {
        setRequests(prev =>
          prev.map(r => (r._id === requestId ? { ...r, assignedAgentId: agents.find(a => a._id === agentId) || r.assignedAgentId, status: 'Assigned' } : r))
        );
        setAssigningRequestId(null);
        setSelectedAgentId('');
      }
    } catch (err) {
      alert(err.message || 'Failed to assign agent');
    } finally {
      setAssignLoading(false);
    }
  };

  // Handle Cash Acknowledgment
  const handleAcknowledgeHandover = async (e) => {
    e.preventDefault();
    if (!selectedHandover) return;

    setProcessingHandover(true);
    setHandoverError('');
    try {
      const amount = Number(receivedAmount);
      if (isNaN(amount) || amount < 0) {
        throw new Error('Please enter a valid received amount');
      }

      const res = await api.post(`api/handovers/${selectedHandover._id}/acknowledge`, {
        receivedAmount: amount,
        inchargeNotes
      });

      if (res.success) {
        // Refresh handovers
        await fetchHandovers();
        setSelectedHandover(null);
        setReceivedAmount('');
        setInchargeNotes('');
      }
    } catch (err) {
      setHandoverError(err.message || 'Failed to acknowledge handover');
    } finally {
      setProcessingHandover(false);
    }
  };

  // Summary Metrics
  const pendingRequestsCount = requests.filter(r => r.status === 'Pending').length;
  const activeJobsCount = requests.filter(r => ['Assigned', 'Accepted', 'In Progress'].includes(r.status)).length;
  const pendingHandoversCount = pendingHandovers.length;
  const todayReconciledCash = allHandovers
    .filter(h => h.status !== 'SUBMITTED' && h.date === new Date().toISOString().split('T')[0])
    .reduce((sum, h) => sum + (Number(h.acknowledgedAmount) || 0), 0);

  // Filtered requests
  const filteredRequests = requests.filter(r => {
    const matchesFilter = requestFilter === 'All' || r.status === requestFilter;
    const matchesSearch =
      (r.serviceType && r.serviceType.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.customerAddress && r.customerAddress.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.customerId?.name && r.customerId.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.assignedAgentId?.name && r.assignedAgentId.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // Filtered ledger handovers
  const filteredHandovers = allHandovers.filter(h => {
    if (handoverFilter === 'ALL') return true;
    return h.status === handoverFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-100">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 leading-tight">Store In-Charge Console</h1>
                <p className="text-xs text-slate-500 font-medium">SBR Central Dispatch & Cash Reconciliation</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-sm bg-slate-100 py-1.5 px-3 rounded-lg border border-slate-200">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="font-medium text-slate-700">{user?.name || 'Store Manager'}</span>
                <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded">Store In-Charge</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center text-sm font-medium text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 p-2 sm:px-3 sm:py-1.5 rounded-lg transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Unassigned</p>
              <p className="text-2xl font-bold text-slate-800">{pendingRequestsCount}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Field Jobs</p>
              <p className="text-2xl font-bold text-slate-800">{activeJobsCount}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending EOD Cash</p>
              <p className="text-2xl font-bold text-slate-800">{pendingHandoversCount}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Today's Cash Reconciled</p>
              <p className="text-2xl font-bold text-emerald-600">₹{todayReconciledCash.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-4 pt-2 shadow-sm space-x-2">
          <button
            onClick={() => switchTab('dispatch')}
            className={`flex items-center px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'dispatch'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Truck className="w-4 h-4 mr-2" />
            <span>Dispatch & Assignment Queue</span>
            {pendingRequestsCount > 0 && (
              <span className="ml-2 bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingRequestsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => switchTab('handovers')}
            className={`flex items-center px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'handovers'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4 mr-2" />
            <span>EOD Cash Reconciliation</span>
            {pendingHandoversCount > 0 && (
              <span className="ml-2 bg-purple-100 text-purple-800 text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingHandoversCount}
              </span>
            )}
          </button>

          <button
            onClick={() => switchTab('audit-ledger')}
            className={`flex items-center px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'audit-ledger'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4 mr-2" />
            <span>Cash Handover Ledger</span>
          </button>

          <button
            onClick={() => switchTab('indents')}
            className={`flex items-center px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'indents'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package className="w-4 h-4 mr-2" />
            <span>Agent Indents & Van Kits</span>
            {pendingIndents.length > 0 && (
              <span className="ml-2 bg-rose-100 text-rose-800 text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingIndents.length}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: DISPATCH & ASSIGNMENT QUEUE */}
        {activeTab === 'dispatch' && (
          <div className="bg-white rounded-b-2xl border border-t-0 border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              {/* Search */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search service, customer, address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Status Filter */}
              <div className="flex flex-wrap gap-2">
                {['All', 'Pending', 'Assigned', 'In Progress', 'Completed'].map(st => (
                  <button
                    key={st}
                    onClick={() => setRequestFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      requestFilter === st
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
                <button
                  onClick={fetchRequestsAndAgents}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl"
                  title="Refresh List"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingRequests ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Request Table / Cards */}
            {loadingRequests ? (
              <div className="text-center py-12 text-slate-500">Loading service requests...</div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-12 text-slate-400">No service requests matching criteria.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Service Type</th>
                      <th className="py-3 px-4">Customer & Address</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Assigned Agent</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRequests.map(req => {
                      const isPending = req.status === 'Pending';
                      return (
                        <tr key={req._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            <div>{req.serviceType}</div>
                            <div className="text-xs text-slate-400 font-normal">
                              {new Date(req.createdAt).toLocaleString()}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-slate-800">{req.customerId?.name || 'Customer'}</div>
                            <div className="text-xs text-slate-500 line-clamp-1">{req.customerAddress}</div>
                            {req.customerId?.phone && (
                              <div className="text-xs text-indigo-600">{req.customerId.phone}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                                req.status === 'Pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : req.status === 'Assigned'
                                  ? 'bg-blue-100 text-blue-800'
                                  : req.status === 'In Progress'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : req.status === 'Completed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {req.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {assigningRequestId === req._id ? (
                              <div className="flex items-center space-x-2">
                                <select
                                  value={selectedAgentId}
                                  onChange={(e) => setSelectedAgentId(e.target.value)}
                                  className="px-2.5 py-1.5 text-xs border rounded-lg bg-white"
                                >
                                  <option value="">Select Agent...</option>
                                  {agents.map(a => (
                                    <option key={a._id} value={a._id}>
                                      {a.name} ({a.phone || 'No phone'})
                                    </option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => handleAssignAgent(req._id, selectedAgentId)}
                                  disabled={!selectedAgentId || assignLoading}
                                  className="p-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
                                  title="Save Assignment"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => { setAssigningRequestId(null); setSelectedAgentId(''); }}
                                  className="p-1.5 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                                  title="Cancel"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : req.assignedAgentId ? (
                              <div className="flex items-center space-x-2">
                                <div>
                                  <div className="font-medium text-slate-800">{req.assignedAgentId.name}</div>
                                  <div className="text-xs text-slate-400">{req.assignedAgentId.phone}</div>
                                </div>
                                <button
                                  onClick={() => {
                                    setAssigningRequestId(req._id);
                                    setSelectedAgentId(req.assignedAgentId._id || '');
                                  }}
                                  className="text-xs text-indigo-600 hover:text-indigo-800 underline ml-2"
                                >
                                  Re-assign
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setAssigningRequestId(req._id);
                                  setSelectedAgentId('');
                                }}
                                className="px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition-colors"
                              >
                                + Assign Agent
                              </button>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {req.paymentAmount > 0 && (
                              <div>
                                <div className="text-xs font-bold text-slate-800">
                                  ₹{req.paymentAmount} <span className="font-normal text-slate-500">({req.paymentMethod || 'Cash'})</span>
                                </div>
                                {(req.inventoryTotal > 0 || req.serviceCharge > 0 || req.discount > 0) && (
                                  <div className="text-[10px] text-slate-500 mt-0.5 space-y-0.5">
                                    {req.inventoryTotal > 0 && <div>Parts: ₹{req.inventoryTotal}</div>}
                                    {req.serviceCharge > 0 && <div>Service: ₹{req.serviceCharge}</div>}
                                    {req.discount > 0 && <div className="text-amber-600 font-medium">Discount: -₹{req.discount}</div>}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: EOD CASH RECONCILIATION */}
        {activeTab === 'handovers' && (
          <div className="bg-white rounded-b-2xl border border-t-0 border-slate-200 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Pending Agent Cash Handovers</h3>
                <p className="text-xs text-slate-500">
                  Verify collected cash amounts from field agents at end of shift.
                </p>
              </div>
              <button
                onClick={fetchHandovers}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loadingHandovers ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loadingHandovers ? (
              <div className="text-center py-12 text-slate-500">Loading pending handovers...</div>
            ) : pendingHandovers.length === 0 ? (
              <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                <p className="text-slate-600 font-semibold">All cash handovers verified & reconciled!</p>
                <p className="text-xs text-slate-400 mt-1">No pending agent cash submissions awaiting your review.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingHandovers.map(handover => (
                  <div
                    key={handover._id}
                    className="p-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                            Date: {handover.date}
                          </span>
                          <h4 className="text-base font-bold text-slate-900 mt-2">
                            {handover.agentId?.name || 'Field Agent'}
                          </h4>
                          <p className="text-xs text-slate-500">{handover.agentId?.phone || handover.agentId?.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400">Declared Cash</p>
                          <p className="text-2xl font-extrabold text-indigo-700">₹{handover.totalCollectedCash}</p>
                        </div>
                      </div>

                      {handover.agentNotes && (
                        <div className="text-xs bg-slate-100 p-2.5 rounded-lg text-slate-700 mb-3">
                          <span className="font-semibold">Agent Notes:</span> {handover.agentNotes}
                        </div>
                      )}

                      {handover.completedRequests && handover.completedRequests.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-slate-500 mb-1.5">
                            Completed Jobs ({handover.completedRequests.length}):
                          </p>
                          <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                            {handover.completedRequests.map((req, i) => (
                              <div key={i} className="text-xs flex justify-between bg-white p-1.5 rounded border">
                                <span className="truncate max-w-[200px] text-slate-700">{req.serviceType}</span>
                                <span className="font-semibold text-slate-900">₹{req.paymentAmount}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setSelectedHandover(handover);
                        setReceivedAmount(handover.totalCollectedCash.toString());
                        setInchargeNotes('');
                        setHandoverError('');
                      }}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm shadow-md transition-colors flex items-center justify-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Verify & Sign Off Handover</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AUDIT LEDGER */}
        {activeTab === 'audit-ledger' && (
          <div className="bg-white rounded-b-2xl border border-t-0 border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">EOD Cash Handover Audit Ledger</h3>
                <p className="text-xs text-slate-500">Historical archive of all verified handovers and discrepancies</p>
              </div>

              <div className="flex gap-2">
                {['ALL', 'ACKNOWLEDGED', 'DISCREPANCY', 'SUBMITTED'].map(st => (
                  <button
                    key={st}
                    onClick={() => setHandoverFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      handoverFilter === st
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {loadingHandovers ? (
              <div className="text-center py-12 text-slate-500">Loading audit ledger...</div>
            ) : filteredHandovers.length === 0 ? (
              <div className="text-center py-12 text-slate-400">No records found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Agent</th>
                      <th className="py-3 px-4">Declared Cash</th>
                      <th className="py-3 px-4">Acknowledged</th>
                      <th className="py-3 px-4">Discrepancy</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Verified By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredHandovers.map(h => (
                      <tr key={h._id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-800">{h.date}</td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900">{h.agentId?.name || 'Agent'}</div>
                          <div className="text-xs text-slate-400">{h.agentId?.phone}</div>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">₹{h.totalCollectedCash}</td>
                        <td className="py-3 px-4 font-bold text-indigo-700">
                          {h.acknowledgedAmount !== null ? `₹${h.acknowledgedAmount}` : '-'}
                        </td>
                        <td className="py-3 px-4">
                          {h.discrepancyAmount !== 0 ? (
                            <span className="font-bold text-red-600">
                              ₹{Math.abs(h.discrepancyAmount)} ({h.discrepancyAmount > 0 ? 'Shortage' : 'Excess'})
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-medium">₹0 (Matched)</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              h.status === 'ACKNOWLEDGED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : h.status === 'DISCREPANCY'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {h.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500">
                          {h.storeInchargeId?.name || '-'}
                          {h.inchargeNotes && (
                            <div className="italic text-slate-400 truncate max-w-[150px]">"{h.inchargeNotes}"</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: AGENT INDENTS & VAN KITS */}
        {activeTab === 'indents' && (
          <div className="bg-white rounded-b-2xl border border-t-0 border-slate-200 p-6 shadow-sm space-y-8">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Agent Parts Indents & Van Kits</h3>
                <p className="text-xs text-slate-500">Approve requisition indents and directly dispatch spare parts to agent vehicles.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowTransferModal(true)}
                  className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Direct Van Stock Allocation
                </button>
                <button
                  onClick={fetchIndentsAndKits}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingIndents ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Pending Indents Queue */}
            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center">
                <Package className="w-4 h-4 mr-2 text-rose-500" />
                <span>Pending Parts Indents ({pendingIndents.length})</span>
              </h4>

              {loadingIndents ? (
                <div className="text-center py-8 text-slate-500 text-sm">Loading indents...</div>
              ) : pendingIndents.length === 0 ? (
                <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-sm">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-1.5" />
                  <p className="font-semibold text-slate-600">No pending indent requests</p>
                  <p className="text-xs text-slate-400">All field agent spare requisitions have been fulfilled.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingIndents.map(indent => (
                    <div key={indent._id} className="p-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-xs font-semibold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full">
                              Agent: {indent.agentId?.name}
                            </span>
                            {indent.serviceRequestId && (
                              <p className="text-xs text-slate-400 mt-1">
                                For Service: {indent.serviceRequestId.serviceType}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-slate-400">
                            {new Date(indent.requestedAt).toLocaleDateString()}
                          </span>
                        </div>

                        {indent.agentRemarks && (
                          <p className="text-xs bg-slate-100 p-2 rounded text-slate-600 mb-3 italic">
                            "{indent.agentRemarks}"
                          </p>
                        )}

                        <div className="space-y-1.5 mb-4">
                          <p className="text-xs font-semibold text-slate-500">Requested Parts:</p>
                          {indent.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between text-xs bg-white p-2 rounded border border-slate-200">
                              <span className="font-medium text-slate-800">{it.productName}</span>
                              <span className="font-bold text-indigo-700">{it.requestedQuantity} unit(s)</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex space-x-2 pt-2">
                        <button
                          onClick={() => handleRejectIndent(indent._id)}
                          className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleDispatchIndent(indent._id)}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs shadow-md transition-colors flex items-center justify-center space-x-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Dispatch Stock</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Agent Van Kit Inventory Inspector */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                <h4 className="text-sm font-bold text-slate-800 flex items-center">
                  <Truck className="w-4 h-4 mr-2 text-indigo-600" />
                  <span>Agent Van Stock Kits</span>
                </h4>
                <div className="flex items-center space-x-2">
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

              {agentInventories.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">No van stock records found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4 text-xs">Agent</th>
                        <th className="py-2.5 px-4 text-xs">Part / Product Name</th>
                        <th className="py-2.5 px-4 text-xs">Category</th>
                        <th className="py-2.5 px-4 text-xs">Qty in Van</th>
                        <th className="py-2.5 px-4 text-xs">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {agentInventories
                        .filter(inv => !selectedAgentForKit || inv.agentId?._id === selectedAgentForKit)
                        .map(inv => (
                          <tr key={inv._id} className="hover:bg-slate-50 text-xs">
                            <td className="py-2.5 px-4 font-medium text-slate-800">
                              {inv.agentId?.name || 'Agent'}
                            </td>
                            <td className="py-2.5 px-4 font-semibold text-slate-900">{inv.productName}</td>
                            <td className="py-2.5 px-4 text-slate-500">{inv.category}</td>
                            <td className="py-2.5 px-4 font-bold text-slate-900">{inv.quantity}</td>
                            <td className="py-2.5 px-4">
                              {inv.quantity <= inv.minThreshold ? (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                  Low Stock (≤{inv.minThreshold})
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  In Stock
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* DIRECT VAN STOCK TRANSFER MODAL */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Direct Van Stock Allocation</h3>
              <button
                onClick={() => setShowTransferModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransferStockSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Field Agent *</label>
                <select
                  value={transferAgentId}
                  onChange={(e) => setTransferAgentId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                  required
                >
                  <option value="">Choose Agent...</option>
                  {agents.map(a => (
                    <option key={a._id} value={a._id}>{a.name} ({a.phone || 'Agent'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Part / Product Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Spun Filter 10 inch"
                  value={transferProductName}
                  onChange={(e) => setTransferProductName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SKU (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. SF-10"
                    value={transferSku}
                    onChange={(e) => setTransferSku(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Transfer Qty *</label>
                  <input
                    type="number"
                    min="1"
                    value={transferQty}
                    onChange={(e) => setTransferQty(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm font-bold"
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 py-2 border rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferLoading}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md disabled:opacity-50"
                >
                  {transferLoading ? 'Transferring...' : 'Transfer to Van'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VERIFY & SIGN OFF MODAL */}
      {selectedHandover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Verify Cash Handover</h3>
                <p className="text-xs text-slate-500">
                  Agent: <span className="font-semibold text-slate-700">{selectedHandover.agentId?.name}</span> ({selectedHandover.date})
                </p>
              </div>
              <button
                onClick={() => setSelectedHandover(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAcknowledgeHandover} className="mt-4 space-y-4">
              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex justify-between items-center">
                <div>
                  <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">Agent Declared Cash</p>
                  <p className="text-2xl font-black text-indigo-900">₹{selectedHandover.totalCollectedCash}</p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p>{selectedHandover.completedRequests?.length || 0} Cash Job(s)</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Actual Received Cash Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-xl font-bold text-slate-900 text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              {Number(receivedAmount) !== selectedHandover.totalCollectedCash && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Discrepancy Detected: </span>
                    {Number(receivedAmount) < selectedHandover.totalCollectedCash ? (
                      <span>Shortage of ₹{selectedHandover.totalCollectedCash - Number(receivedAmount)}</span>
                    ) : (
                      <span>Excess of ₹{Number(receivedAmount) - selectedHandover.totalCollectedCash}</span>
                    )}
                    . This will be flagged on the audit ledger.
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Store In-Charge Notes / Audit Reason
                </label>
                <textarea
                  rows="2"
                  value={inchargeNotes}
                  onChange={(e) => setInchargeNotes(e.target.value)}
                  placeholder="e.g. Cash verified & sealed in safe, shortage noted on invoice #..."
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {handoverError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-medium">
                  {handoverError}
                </div>
              )}

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedHandover(null)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingHandover}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm shadow-md transition-colors disabled:opacity-50"
                >
                  {processingHandover ? 'Verifying...' : 'Sign Off & Reconcile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreInchargeDashboard;
