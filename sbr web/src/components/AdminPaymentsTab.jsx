import React, { useState, useEffect, useMemo } from 'react';
import { 
  CreditCard, 
  Calendar, 
  Search, 
  RefreshCw, 
  Download, 
  Printer, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Filter, 
  User, 
  FileText,
  ChevronDown,
  ChevronUp,
  Store,
  Wallet,
  Smartphone,
  Check,
  Building
} from 'lucide-react';
import { api } from '../utils/api';

const AdminPaymentsTab = ({ users = [] }) => {
  const [handovers, setHandovers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Active Sub Tab: 'all-payments' (Service requests & collections) vs 'handovers' (EOD Store Incharge submissions)
  const [activeSubTab, setActiveSubTab] = useState('all-payments');

  // Date Range Filters
  const [dateFilterType, setDateFilterType] = useState('all'); // 'today', 'week', 'month', 'custom', 'all'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Other Filters
  const [selectedAgentId, setSelectedAgentId] = useState('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('all'); // 'all', 'Cash', 'Online', 'UPI'
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Expanded Row State
  const [expandedRowId, setExpandedRowId] = useState(null);

  const fetchPaymentsData = async () => {
    setLoading(true);
    setError('');
    try {
      const [handoverRes, requestRes] = await Promise.all([
        api.get('api/handovers/all').catch(() => ({ success: true, data: [] })),
        api.get('api/requests')
      ]);

      if (handoverRes.success) setHandovers(handoverRes.data || []);
      if (requestRes.success) setRequests(requestRes.data || []);
    } catch (err) {
      console.error('Failed to load payments data:', err);
      setError(err.message || 'Failed to load payments and handovers data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentsData();
  }, []);

  // Filter Agents list
  const agentsList = useMemo(() => {
    return (users || []).filter(u => u && (String(u.role || '').toUpperCase() === 'AGENT'));
  }, [users]);

  // Date Calculation Helper
  const isDateInRange = (dateVal) => {
    if (!dateVal) return true; // If no date, include in 'all'
    const itemDate = new Date(dateVal);
    if (isNaN(itemDate.getTime())) return true;

    const today = new Date();
    const itemDateStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const testDateStart = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate()).getTime();

    if (dateFilterType === 'today') {
      return testDateStart === itemDateStart;
    } else if (dateFilterType === 'week') {
      const dayOfWeek = today.getDay();
      const firstDayOfWeek = new Date(today);
      firstDayOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      firstDayOfWeek.setHours(0, 0, 0, 0);
      return itemDate.getTime() >= firstDayOfWeek.getTime();
    } else if (dateFilterType === 'month') {
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
      return itemDate.getTime() >= firstDayOfMonth;
    } else if (dateFilterType === 'custom') {
      if (!customStartDate && !customEndDate) return true;
      const start = customStartDate ? new Date(customStartDate).setHours(0, 0, 0, 0) : 0;
      const end = customEndDate ? new Date(customEndDate).setHours(23, 59, 59, 999) : Infinity;
      const time = itemDate.getTime();
      return time >= start && time <= end;
    }
    return true; // 'all'
  };

  // Filtered Service Requests Payments
  const filteredServicePayments = useMemo(() => {
    return (requests || []).filter(req => {
      if (!req) return false;
      // Must have payment amount or be completed/paid
      const amt = Number(req.paymentAmount) || 0;
      const payStatus = String(req.paymentStatus || '').toLowerCase();
      const jobStatus = String(req.status || '').toLowerCase();

      const hasPayment = amt > 0 || payStatus === 'paid' || jobStatus === 'completed';
      
      if (!hasPayment) return false;

      // Date filter
      const reqDate = req.paymentTimestamp || req.completedAt || req.createdAt || req.updatedAt;
      const dateMatches = isDateInRange(reqDate);

      // Agent filter
      const agentIdVal = req.assignedAgentId?._id || req.assignedAgentId?.id || (typeof req.assignedAgentId === 'string' ? req.assignedAgentId : null);
      const agentMatches = selectedAgentId === 'all' || agentIdVal === selectedAgentId;

      // Payment Method filter
      const method = String(req.paymentMethod || 'Cash').toLowerCase();
      const methodMatches = selectedPaymentMethod === 'all' || 
        (selectedPaymentMethod === 'Cash' && (method.includes('cash') || !req.paymentMethod)) ||
        (selectedPaymentMethod === 'Online' && (method.includes('online') || method.includes('upi') || method.includes('card') || method.includes('net')));

      // Search Query
      const query = String(searchQuery || '').toLowerCase().trim();
      const sType = String(req.serviceType || '').toLowerCase();
      const addr = String(req.customerAddress || '').toLowerCase();
      const custName = String((req.customerId && typeof req.customerId === 'object' ? req.customerId.name : req.customerName) || '').toLowerCase();
      const agentName = String((req.assignedAgentId && typeof req.assignedAgentId === 'object' ? req.assignedAgentId.name : '') || '').toLowerCase();
      const reqId = String(req._id || '').toLowerCase();

      const searchMatches = !query || 
        sType.includes(query) || 
        addr.includes(query) || 
        custName.includes(query) || 
        agentName.includes(query) || 
        reqId.includes(query);

      return dateMatches && agentMatches && methodMatches && searchMatches;
    });
  }, [requests, dateFilterType, customStartDate, customEndDate, selectedAgentId, selectedPaymentMethod, searchQuery]);

  // Filtered Handovers
  const filteredHandovers = useMemo(() => {
    return (handovers || []).filter(item => {
      if (!item) return false;
      const dateMatches = isDateInRange(item.date || item.submittedAt);
      const agentIdVal = item.agentId?._id || item.agentId?.id || (typeof item.agentId === 'string' ? item.agentId : null);
      const agentMatches = selectedAgentId === 'all' || agentIdVal === selectedAgentId;
      const statusMatches = selectedStatus === 'all' || item.status === selectedStatus;

      const query = String(searchQuery || '').toLowerCase().trim();
      const agentName = String((item.agentId && typeof item.agentId === 'object' ? item.agentId.name : '') || '').toLowerCase();
      const inchargeName = String((item.storeInchargeId && typeof item.storeInchargeId === 'object' ? item.storeInchargeId.name : '') || '').toLowerCase();
      const notes = String(item.inchargeNotes || item.agentNotes || '').toLowerCase();
      const searchMatches = !query || agentName.includes(query) || inchargeName.includes(query) || notes.includes(query);

      return dateMatches && agentMatches && statusMatches && searchMatches;
    });
  }, [handovers, dateFilterType, customStartDate, customEndDate, selectedAgentId, selectedStatus, searchQuery]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let cashCollections = 0;
    let digitalCollections = 0;
    let totalJobsCount = filteredServicePayments.length;

    filteredServicePayments.forEach(req => {
      const amt = Number(req.paymentAmount) || 0;
      totalRevenue += amt;
      const method = String(req.paymentMethod || 'Cash').toLowerCase();
      if (method.includes('online') || method.includes('upi') || method.includes('card')) {
        digitalCollections += amt;
      } else {
        cashCollections += amt;
      }
    });

    let storeAcknowledgedCash = 0;
    let totalDiscrepancy = 0;
    let pendingHandoversCount = 0;

    filteredHandovers.forEach(h => {
      const collected = Number(h.totalCollectedCash) || 0;
      const ack = h.acknowledgedAmount !== null && h.acknowledgedAmount !== undefined 
        ? Number(h.acknowledgedAmount) 
        : (h.status === 'ACKNOWLEDGED' ? collected : 0);
      const disc = Number(h.discrepancyAmount) || 0;

      storeAcknowledgedCash += ack;
      totalDiscrepancy += disc;

      if (h.status === 'SUBMITTED') pendingHandoversCount++;
    });

    return {
      totalRevenue,
      cashCollections,
      digitalCollections,
      totalJobsCount,
      storeAcknowledgedCash,
      totalDiscrepancy,
      pendingHandoversCount,
      totalHandovers: filteredHandovers.length
    };
  }, [filteredServicePayments, filteredHandovers]);

  // Agent-Wise Breakdown Summary Table
  const agentWiseBreakup = useMemo(() => {
    const map = {};

    // First populate from all active agents
    (agentsList || []).forEach(a => {
      if (!a) return;
      map[a._id] = {
        id: a._id,
        name: a.name || 'Agent',
        phone: a.phone || 'N/A',
        jobsCount: 0,
        cashCollected: 0,
        digitalCollected: 0,
        totalCollected: 0,
        storeAcknowledged: 0,
        discrepancy: 0,
        pendingHandovers: 0
      };
    });

    // Aggregate Service Requests payments
    (filteredServicePayments || []).forEach(req => {
      if (!req) return;
      const agentId = req.assignedAgentId?._id || req.assignedAgentId?.id || (typeof req.assignedAgentId === 'string' ? req.assignedAgentId : 'unassigned');
      const agentName = (req.assignedAgentId && typeof req.assignedAgentId === 'object' ? req.assignedAgentId.name : null) || (typeof req.assignedAgentId === 'string' ? 'Assigned Agent' : 'Unassigned Agent');
      const agentPhone = (req.assignedAgentId && typeof req.assignedAgentId === 'object' ? req.assignedAgentId.phone : null) || 'N/A';

      if (!map[agentId]) {
        map[agentId] = {
          id: agentId,
          name: agentName,
          phone: agentPhone,
          jobsCount: 0,
          cashCollected: 0,
          digitalCollected: 0,
          totalCollected: 0,
          storeAcknowledged: 0,
          discrepancy: 0,
          pendingHandovers: 0
        };
      }

      const amt = Number(req.paymentAmount) || 0;
      const method = String(req.paymentMethod || 'Cash').toLowerCase();

      map[agentId].jobsCount += 1;
      map[agentId].totalCollected += amt;

      if (method.includes('online') || method.includes('upi') || method.includes('card')) {
        map[agentId].digitalCollected += amt;
      } else {
        map[agentId].cashCollected += amt;
      }
    });

    // Aggregate Handovers if any
    (filteredHandovers || []).forEach(h => {
      if (!h) return;
      const agentId = h.agentId?._id || h.agentId?.id || (typeof h.agentId === 'string' ? h.agentId : null);
      if (agentId && map[agentId]) {
        const ack = h.acknowledgedAmount !== null && h.acknowledgedAmount !== undefined 
          ? Number(h.acknowledgedAmount) 
          : (h.status === 'ACKNOWLEDGED' ? Number(h.totalCollectedCash || 0) : 0);
        map[agentId].storeAcknowledged += ack;
        map[agentId].discrepancy += (Number(h.discrepancyAmount) || 0);
        if (h.status === 'SUBMITTED') map[agentId].pendingHandovers += 1;
      }
    });

    return Object.values(map).filter(a => a.totalCollected > 0 || a.jobsCount > 0);
  }, [agentsList, filteredServicePayments, filteredHandovers]);

  // Export CSV Report
  const handleExportCSV = () => {
    if (filteredServicePayments.length === 0 && filteredHandovers.length === 0) {
      alert('No payment records to export for the selected filters.');
      return;
    }

    const headers = [
      'Date',
      'Transaction / Request ID',
      'Service Type',
      'Customer Name',
      'Customer Address',
      'Assigned Agent',
      'Agent Phone',
      'Payment Method',
      'Payment Status',
      'Collected Amount (INR)'
    ];

    const rows = filteredServicePayments.map(req => {
      const d = req.paymentTimestamp || req.completedAt || req.createdAt || '';
      const dateStr = d ? new Date(d).toLocaleDateString() : '';
      const reqId = req._id || '';
      const sType = req.serviceType || 'Service';
      const custName = (req.customerId && typeof req.customerId === 'object' ? req.customerId.name : req.customerName) || 'Customer';
      const custAddr = String(req.customerAddress || '').replace(/"/g, '""');
      const agName = (req.assignedAgentId && typeof req.assignedAgentId === 'object' ? req.assignedAgentId.name : null) || (typeof req.assignedAgentId === 'string' ? 'Assigned' : 'Unassigned');
      const agPhone = (req.assignedAgentId && typeof req.assignedAgentId === 'object' ? req.assignedAgentId.phone : '') || '';
      const pMethod = req.paymentMethod || 'Cash';
      const pStatus = req.paymentStatus || req.status || 'Paid';
      const amt = req.paymentAmount || 0;

      return [
        `"${dateStr}"`,
        `"${reqId}"`,
        `"${sType}"`,
        `"${custName}"`,
        `"${custAddr}"`,
        `"${agName}"`,
        `"${agPhone}"`,
        `"${pMethod}"`,
        `"${pStatus}"`,
        `"${amt}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SBR_Collections_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="section-card payments-report-container">
      {/* Header & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '24px' }}>
        <div>
          <h2 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CreditCard className="text-primary" size={24} /> Financial Collections & Payments Report
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
            Live tracking of customer service job payments, field cash collections, and Store In-Charge reconciliation responses.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            className="btn-outline" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px' }}
            onClick={fetchPaymentsData}
            title="Refresh Data"
          >
            <RefreshCw size={15} /> Refresh
          </button>
          <button 
            className="btn-outline" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px' }}
            onClick={handlePrint}
            title="Print Report"
          >
            <Printer size={15} /> Print
          </button>
          <button 
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px' }}
            onClick={handleExportCSV}
          >
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* Date Filter Bar & Controls */}
      <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Quick Date Presets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={15} /> Period:
            </span>
            <div style={{ display: 'flex', gap: '6px', background: '#e2e8f0', padding: '4px', borderRadius: '8px' }}>
              <button 
                onClick={() => setDateFilterType('all')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: dateFilterType === 'all' ? '#0284c7' : 'transparent',
                  color: dateFilterType === 'all' ? '#fff' : '#475569',
                  transition: 'all 0.2s'
                }}
              >
                All Time
              </button>
              <button 
                onClick={() => setDateFilterType('today')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: dateFilterType === 'today' ? '#0284c7' : 'transparent',
                  color: dateFilterType === 'today' ? '#fff' : '#475569',
                  transition: 'all 0.2s'
                }}
              >
                Daily (Today)
              </button>
              <button 
                onClick={() => setDateFilterType('week')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: dateFilterType === 'week' ? '#0284c7' : 'transparent',
                  color: dateFilterType === 'week' ? '#fff' : '#475569',
                  transition: 'all 0.2s'
                }}
              >
                This Week
              </button>
              <button 
                onClick={() => setDateFilterType('month')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: dateFilterType === 'month' ? '#0284c7' : 'transparent',
                  color: dateFilterType === 'month' ? '#fff' : '#475569',
                  transition: 'all 0.2s'
                }}
              >
                This Month
              </button>
              <button 
                onClick={() => setDateFilterType('custom')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: dateFilterType === 'custom' ? '#0284c7' : 'transparent',
                  color: dateFilterType === 'custom' ? '#fff' : '#475569',
                  transition: 'all 0.2s'
                }}
              >
                Custom Range
              </button>
            </div>
          </div>

          {/* Custom Date Pickers */}
          {dateFilterType === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>From:</span>
                <input 
                  type="date" 
                  value={customStartDate} 
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>To:</span>
                <input 
                  type="date" 
                  value={customEndDate} 
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>
            </div>
          )}

          {/* Secondary Filters: Agent, Method, Search */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <select 
              value={selectedAgentId} 
              onChange={(e) => setSelectedAgentId(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
            >
              <option value="all">All Field Agents</option>
              {agentsList.map(a => (
                <option key={a._id} value={a._id}>{a.name} ({a.phone || 'No phone'})</option>
              ))}
            </select>

            <select 
              value={selectedPaymentMethod} 
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
            >
              <option value="all">All Methods</option>
              <option value="Cash">Cash Collections</option>
              <option value="Online">Online / Digital / UPI</option>
            </select>

            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder="Search job, agent, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '8px 12px 8px 30px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', width: '180px' }}
              />
            </div>
          </div>

        </div>
      </div>

      {/* KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        
        {/* Card 1: Total Revenue Collections */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Total Revenue / Collections</span>
            <div style={{ background: '#e0f2fe', color: '#0284c7', padding: '6px', borderRadius: '8px' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
            ₹{metrics.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            From <strong>{metrics.totalJobsCount}</strong> completed service jobs
          </div>
        </div>

        {/* Card 2: Cash Collections */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Cash Collected by Agents</span>
            <div style={{ background: '#dcfce7', color: '#16a34a', padding: '6px', borderRadius: '8px' }}>
              <Wallet size={18} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#15803d' }}>
            ₹{metrics.cashCollections.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Subject to EOD Store In-Charge handover
          </div>
        </div>

        {/* Card 3: Digital / Online Collections */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Digital / UPI Collections</span>
            <div style={{ background: '#f3e8ff', color: '#7c3aed', padding: '6px', borderRadius: '8px' }}>
              <Smartphone size={18} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#7c3aed' }}>
            ₹{metrics.digitalCollections.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Directly credited to company accounts
          </div>
        </div>

        {/* Card 4: Store Incharge Verified */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Store In-Charge Counted</span>
            <div style={{ background: '#fef3c7', color: '#d97706', padding: '6px', borderRadius: '8px' }}>
              <Building size={18} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#d97706' }}>
            ₹{metrics.storeAcknowledgedCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '12px', color: metrics.totalDiscrepancy !== 0 ? '#dc2626' : '#64748b' }}>
            {metrics.totalDiscrepancy !== 0 ? `Variance: ₹${metrics.totalDiscrepancy}` : 'No variance reported'}
          </div>
        </div>

      </div>

      {/* Agent-Wise Collections Breakup Summary Table */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={18} color="#0284c7" /> Field Agent-Wise Collections Breakup
        </h3>

        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Agent Name</th>
                <th>Phone</th>
                <th style={{ textAlign: 'center' }}>Completed Jobs</th>
                <th style={{ textAlign: 'right' }}>Cash Collected</th>
                <th style={{ textAlign: 'right' }}>Digital / UPI</th>
                <th style={{ textAlign: 'right' }}>Total Collections</th>
                <th style={{ textAlign: 'right' }}>Store Reconciled</th>
              </tr>
            </thead>
            <tbody>
              {agentWiseBreakup.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>
                    No collections found matching the selected period.
                  </td>
                </tr>
              ) : (
                agentWiseBreakup.map(item => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: '600', color: '#0f172a' }}>{item.name}</td>
                    <td>{item.phone}</td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.jobsCount}</td>
                    <td style={{ textAlign: 'right', fontWeight: '600', color: '#15803d' }}>
                      ₹{item.cashCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '600', color: '#7c3aed' }}>
                      ₹{item.digitalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '800', color: '#0284c7' }}>
                      ₹{item.totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '600', color: '#0f172a' }}>
                      {item.storeAcknowledged > 0 ? (
                        <span style={{ color: '#15803d' }}>₹{item.storeAcknowledged.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>Pending Handover</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sub-Tabs: Service Job Collections vs Handover Reconciliation Ledger */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', gap: '20px' }}>
          <button
            onClick={() => setActiveSubTab('all-payments')}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: 'transparent',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              color: activeSubTab === 'all-payments' ? '#0284c7' : '#64748b',
              borderBottom: activeSubTab === 'all-payments' ? '3px solid #0284c7' : '3px solid transparent',
              marginBottom: '-2px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <CreditCard size={16} /> Individual Service Job Collections ({filteredServicePayments.length})
          </button>

          <button
            onClick={() => setActiveSubTab('handovers')}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: 'transparent',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              color: activeSubTab === 'handovers' ? '#0284c7' : '#64748b',
              borderBottom: activeSubTab === 'handovers' ? '3px solid #0284c7' : '3px solid transparent',
              marginBottom: '-2px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Store size={16} /> EOD Cash Handovers & Store In-Charge Audit ({filteredHandovers.length})
          </button>
        </div>
      </div>

      {/* Content for SubTab 1: Individual Service Job Payments */}
      {activeSubTab === 'all-payments' && (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <RefreshCw className="spin" size={24} style={{ margin: '0 auto 10px auto' }} />
              <p>Loading service collections...</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Request ID</th>
                    <th>Service Type</th>
                    <th>Customer Name & Address</th>
                    <th>Assigned Agent</th>
                    <th>Payment Method</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Collected Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServicePayments.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>
                        No service payment records matching the selected period and filters.
                      </td>
                    </tr>
                  ) : (
                    filteredServicePayments.map(req => {
                      const d = req.paymentTimestamp || req.completedAt || req.createdAt || req.updatedAt;
                      const dateStr = d ? new Date(d).toLocaleDateString() : 'N/A';
                      const custName = typeof req.customerId === 'object' ? req.customerId?.name : 'Customer';
                      const agName = typeof req.assignedAgentId === 'object' ? req.assignedAgentId?.name : (typeof req.assignedAgentId === 'string' ? 'Assigned' : 'Unassigned');
                      const pMethod = req.paymentMethod || 'Cash';
                      const amt = Number(req.paymentAmount) || 0;

                      const isOnline = pMethod.toLowerCase().includes('online') || pMethod.toLowerCase().includes('upi') || pMethod.toLowerCase().includes('card');

                      return (
                        <tr key={req._id}>
                          <td style={{ fontSize: '12px', color: '#475569', fontWeight: '500' }}>{dateStr}</td>
                          <td style={{ fontFamily: 'monospace', color: '#0284c7', fontSize: '12px', fontWeight: 'bold' }}>
                            #{String(req._id).slice(-6).toUpperCase()}
                          </td>
                          <td style={{ fontWeight: '600', color: '#0f172a' }}>{req.serviceType}</td>
                          <td>
                            <div style={{ fontWeight: '600', fontSize: '13px' }}>{custName}</div>
                            <div style={{ fontSize: '11.5px', color: '#64748b' }}>{req.customerAddress || 'No address'}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: '600', color: '#0f172a' }}>{agName}</div>
                            {typeof req.assignedAgentId === 'object' && req.assignedAgentId?.phone && (
                              <div style={{ fontSize: '11px', color: '#64748b' }}>{req.assignedAgentId.phone}</div>
                            )}
                          </td>
                          <td>
                            <span style={{
                              background: isOnline ? '#f3e8ff' : '#dcfce7',
                              color: isOnline ? '#7c3aed' : '#15803d',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '700'
                            }}>
                              {pMethod}
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-completed">
                              {req.paymentStatus || req.status || 'PAID'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: '800', color: '#0f172a', fontSize: '14px' }}>
                            ₹{amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Content for SubTab 2: EOD Cash Handovers & Store In-Charge Ledger */}
      {activeSubTab === 'handovers' && (
        <div>
          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date & Timestamp</th>
                  <th>Field Agent</th>
                  <th style={{ textAlign: 'right' }}>Submitted Cash</th>
                  <th style={{ textAlign: 'center' }}>Jobs</th>
                  <th>Store In-Charge Response</th>
                  <th style={{ textAlign: 'right' }}>Counted / Variance</th>
                  <th>Audit Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHandovers.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>
                      No EOD cash handovers recorded yet for the selected period.
                    </td>
                  </tr>
                ) : (
                  filteredHandovers.map(handover => {
                    const isExpanded = expandedRowId === handover._id;
                    const isDiscrepancy = handover.status === 'DISCREPANCY' || (handover.discrepancyAmount && handover.discrepancyAmount !== 0);
                    const isAcknowledged = handover.status === 'ACKNOWLEDGED';

                    return (
                      <React.Fragment key={handover._id}>
                        <tr style={{ background: isExpanded ? '#f8fafc' : 'transparent' }}>
                          <td>
                            <div style={{ fontWeight: '700', color: '#0f172a' }}>{handover.date}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              {handover.submittedAt ? new Date(handover.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: '600', color: '#0f172a' }}>{handover.agentId?.name || 'Field Agent'}</div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>{handover.agentId?.phone || ''}</div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '15px', fontWeight: '800', color: '#0284c7' }}>
                              ₹{Number(handover.totalCollectedCash || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ background: '#f1f5f9', color: '#334155', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                              {handover.completedRequests?.length || 0} visits
                            </span>
                          </td>
                          <td>
                            {isAcknowledged ? (
                              <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle size={12} /> ACKNOWLEDGED
                              </span>
                            ) : isDiscrepancy ? (
                              <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <AlertTriangle size={12} /> DISCREPANCY
                              </span>
                            ) : (
                              <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={12} /> PENDING STORE
                              </span>
                            )}
                            {handover.storeInchargeId && (
                              <div style={{ fontSize: '11px', color: '#475569', marginTop: '3px' }}>
                                By: <strong>{handover.storeInchargeId.name}</strong>
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {handover.acknowledgedAmount !== null && handover.acknowledgedAmount !== undefined ? (
                              <div>
                                <div style={{ fontWeight: '700', color: '#15803d', fontSize: '14px' }}>
                                  ₹{Number(handover.acknowledgedAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </div>
                                {isDiscrepancy && (
                                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#dc2626' }}>
                                    Variance: {handover.discrepancyAmount > 0 ? `+₹${handover.discrepancyAmount}` : `-₹${Math.abs(handover.discrepancyAmount)}`}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '12px' }}>Awaiting Count</span>
                            )}
                          </td>
                          <td>
                            {handover.inchargeNotes ? (
                              <div style={{ fontSize: '12px', color: '#0f172a' }}>
                                <span style={{ color: '#059669', fontWeight: '600' }}>Store Note:</span> {handover.inchargeNotes}
                              </div>
                            ) : handover.agentNotes ? (
                              <div style={{ fontSize: '12px', color: '#64748b' }}>
                                <span style={{ fontWeight: '600' }}>Agent Note:</span> {handover.agentNotes}
                              </div>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '12px' }}>-</span>
                            )}
                          </td>
                          <td>
                            <button
                              className="btn-outline"
                              style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => setExpandedRowId(isExpanded ? null : handover._id)}
                            >
                              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                              {isExpanded ? 'Hide Visits' : 'View Visits'}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Sub-Table */}
                        {isExpanded && (
                          <tr>
                            <td colSpan="8" style={{ background: '#f8fafc', padding: '16px 20px', borderBottom: '2px solid #cbd5e1' }}>
                              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
                                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <FileText size={15} color="#0284c7" /> Included Service Jobs & Cash Collected Breakdown:
                                </div>

                                {(!handover.completedRequests || handover.completedRequests.length === 0) ? (
                                  <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>No individual visit metadata attached to this submission.</p>
                                ) : (
                                  <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                                    <thead>
                                      <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                                        <th style={{ padding: '6px' }}>Job ID</th>
                                        <th style={{ padding: '6px' }}>Service Type</th>
                                        <th style={{ padding: '6px' }}>Customer Site Address</th>
                                        <th style={{ padding: '6px', textAlign: 'right' }}>Collected Amount</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {handover.completedRequests.map((req, rIdx) => {
                                        const reqId = typeof req === 'object' && req._id ? req._id : (typeof req === 'string' ? req : `Visit #${rIdx + 1}`);
                                        const sType = typeof req === 'object' && req.serviceType ? req.serviceType : 'Service Job';
                                        const addr = typeof req === 'object' && req.customerAddress ? req.customerAddress : 'Customer Location';
                                        const amt = typeof req === 'object' && req.paymentAmount ? Number(req.paymentAmount) : 0;

                                        return (
                                          <tr key={rIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '6px', fontFamily: 'monospace', color: '#0284c7' }}>{String(reqId).slice(-6).toUpperCase()}</td>
                                            <td style={{ padding: '6px', fontWeight: '600' }}>{sType}</td>
                                            <td style={{ padding: '6px', color: '#64748b' }}>{addr}</td>
                                            <td style={{ padding: '6px', textAlign: 'right', fontWeight: '700', color: '#059669' }}>
                                              ₹{amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentsTab;
