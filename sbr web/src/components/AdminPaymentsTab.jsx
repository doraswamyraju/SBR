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
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../utils/api';

const AdminPaymentsTab = ({ users = [] }) => {
  const [handovers, setHandovers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Date Range Filters
  const [dateFilterType, setDateFilterType] = useState('all'); // 'today', 'week', 'month', 'custom', 'all'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Other Filters
  const [selectedAgentId, setSelectedAgentId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Expanded Row State for completed requests details
  const [expandedRowId, setExpandedRowId] = useState(null);

  const fetchPaymentsData = async () => {
    setLoading(true);
    setError('');
    try {
      const [handoverRes, requestRes] = await Promise.all([
        api.get('api/handovers/all'),
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
    return users.filter(u => u.role === 'AGENT' || u.role === 'agent');
  }, [users]);

  // Date Calculation Helpers
  const isDateInRange = (dateStr) => {
    if (!dateStr) return false;
    const itemDate = new Date(dateStr);
    const today = new Date();
    
    // Normalize to start of day for accurate comparison
    const itemDateStart = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate()).getTime();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    if (dateFilterType === 'today') {
      return itemDateStart === todayStart;
    } else if (dateFilterType === 'week') {
      const dayOfWeek = today.getDay(); // 0 (Sun) to 6 (Sat)
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

  // Filtered Handovers
  const filteredHandovers = useMemo(() => {
    return handovers.filter(item => {
      // Date filter (check item.date or item.submittedAt)
      const dateMatches = isDateInRange(item.date || item.submittedAt);

      // Agent filter
      const agentIdVal = item.agentId?._id || item.agentId?.id || (typeof item.agentId === 'string' ? item.agentId : null);
      const agentMatches = selectedAgentId === 'all' || agentIdVal === selectedAgentId;

      // Status filter
      const statusMatches = selectedStatus === 'all' || item.status === selectedStatus;

      // Search Query
      const query = searchQuery.toLowerCase().trim();
      const agentName = (item.agentId?.name || '').toLowerCase();
      const agentPhone = (item.agentId?.phone || '').toLowerCase();
      const inchargeName = (item.storeInchargeId?.name || '').toLowerCase();
      const notes = (item.inchargeNotes || item.agentNotes || '').toLowerCase();
      const searchMatches = !query || 
        agentName.includes(query) || 
        agentPhone.includes(query) || 
        inchargeName.includes(query) || 
        notes.includes(query);

      return dateMatches && agentMatches && statusMatches && searchMatches;
    });
  }, [handovers, dateFilterType, customStartDate, customEndDate, selectedAgentId, selectedStatus, searchQuery]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let totalCollected = 0;
    let totalAcknowledged = 0;
    let totalDiscrepancy = 0;
    let totalCompletedJobs = 0;
    let settledCount = 0;
    let pendingCount = 0;
    let discrepancyCount = 0;

    filteredHandovers.forEach(h => {
      const collected = Number(h.totalCollectedCash) || 0;
      const ack = h.acknowledgedAmount !== null && h.acknowledgedAmount !== undefined 
        ? Number(h.acknowledgedAmount) 
        : (h.status === 'ACKNOWLEDGED' ? collected : 0);
      const disc = Number(h.discrepancyAmount) || 0;

      totalCollected += collected;
      totalAcknowledged += ack;
      totalDiscrepancy += disc;
      totalCompletedJobs += (h.completedRequests?.length || 0);

      if (h.status === 'ACKNOWLEDGED') settledCount++;
      else if (h.status === 'DISCREPANCY') {
        settledCount++;
        discrepancyCount++;
      } else {
        pendingCount++;
      }
    });

    const settlementRate = filteredHandovers.length > 0 
      ? Math.round((settledCount / filteredHandovers.length) * 100) 
      : 100;

    return {
      totalCollected,
      totalAcknowledged,
      totalDiscrepancy,
      totalCompletedJobs,
      settledCount,
      pendingCount,
      discrepancyCount,
      settlementRate,
      totalHandovers: filteredHandovers.length
    };
  }, [filteredHandovers]);

  // Agent-Wise Breakdown Summary Table
  const agentWiseBreakup = useMemo(() => {
    const map = {};

    filteredHandovers.forEach(h => {
      const agentId = h.agentId?._id || h.agentId?.id || (typeof h.agentId === 'string' ? h.agentId : 'unknown');
      const agentName = h.agentId?.name || 'Unknown Agent';
      const agentPhone = h.agentId?.phone || 'N/A';

      if (!map[agentId]) {
        map[agentId] = {
          id: agentId,
          name: agentName,
          phone: agentPhone,
          totalCollected: 0,
          totalAcknowledged: 0,
          totalDiscrepancy: 0,
          completedJobs: 0,
          handoverCount: 0,
          pendingHandovers: 0,
          discrepancyCount: 0
        };
      }

      const collected = Number(h.totalCollectedCash) || 0;
      const ack = h.acknowledgedAmount !== null && h.acknowledgedAmount !== undefined 
        ? Number(h.acknowledgedAmount) 
        : (h.status === 'ACKNOWLEDGED' ? collected : 0);
      const disc = Number(h.discrepancyAmount) || 0;

      map[agentId].totalCollected += collected;
      map[agentId].totalAcknowledged += ack;
      map[agentId].totalDiscrepancy += disc;
      map[agentId].completedJobs += (h.completedRequests?.length || 0);
      map[agentId].handoverCount += 1;

      if (h.status === 'SUBMITTED') map[agentId].pendingHandovers += 1;
      if (h.status === 'DISCREPANCY') map[agentId].discrepancyCount += 1;
    });

    return Object.values(map);
  }, [filteredHandovers]);

  // Export CSV Report
  const handleExportCSV = () => {
    if (filteredHandovers.length === 0) {
      alert('No payment handover records to export for the selected filter.');
      return;
    }

    const headers = [
      'Date',
      'Agent Name',
      'Agent Phone',
      'Total Collected Cash (INR)',
      'Completed Jobs Count',
      'Handover Status',
      'Store Incharge Verified Amount (INR)',
      'Variance / Discrepancy (INR)',
      'Store Incharge Name',
      'Store Incharge Phone',
      'Store Incharge Remarks',
      'Agent Remarks',
      'Submitted At',
      'Acknowledged At'
    ];

    const rows = filteredHandovers.map(h => [
      `"${h.date || ''}"`,
      `"${h.agentId?.name || 'Unknown'}"`,
      `"${h.agentId?.phone || ''}"`,
      `"${h.totalCollectedCash || 0}"`,
      `"${h.completedRequests?.length || 0}"`,
      `"${h.status || 'SUBMITTED'}"`,
      `"${h.acknowledgedAmount !== null && h.acknowledgedAmount !== undefined ? h.acknowledgedAmount : ''}"`,
      `"${h.discrepancyAmount || 0}"`,
      `"${h.storeInchargeId?.name || ''}"`,
      `"${h.storeInchargeId?.phone || ''}"`,
      `"${(h.inchargeNotes || '').replace(/"/g, '""')}"`,
      `"${(h.agentNotes || '').replace(/"/g, '""')}"`,
      `"${h.submittedAt ? new Date(h.submittedAt).toLocaleString() : ''}"`,
      `"${h.acknowledgedAt ? new Date(h.acknowledgedAt).toLocaleString() : ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SBR_Payments_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Report Handler
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
            Field cash handovers, technician collections breakup, and Store In-Charge audit verification responses.
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

          {/* Secondary Filters: Agent, Status, Search */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Agent Select */}
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

            {/* Status Select */}
            <select 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
            >
              <option value="all">All Statuses</option>
              <option value="ACKNOWLEDGED">Acknowledged & Settled</option>
              <option value="SUBMITTED">Pending Store Verification</option>
              <option value="DISCREPANCY">Discrepancy / Variance</option>
            </select>

            {/* Search Box */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder="Search agent, notes..."
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
        
        {/* Card 1: Total Collected */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Total Field Cash Collected</span>
            <div style={{ background: '#e0f2fe', color: '#0284c7', padding: '6px', borderRadius: '8px' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
            ₹{metrics.totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Across <strong>{metrics.totalCompletedJobs}</strong> completed service visits
          </div>
        </div>

        {/* Card 2: Total Settled / Acknowledged */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Store Verified & Counted</span>
            <div style={{ background: '#dcfce7', color: '#16a34a', padding: '6px', borderRadius: '8px' }}>
              <CheckCircle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#15803d' }}>
            ₹{metrics.totalAcknowledged.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            <strong>{metrics.settledCount}</strong> of <strong>{metrics.totalHandovers}</strong> handovers confirmed
          </div>
        </div>

        {/* Card 3: Discrepancies */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Net Physical Discrepancy</span>
            <div style={{ background: metrics.totalDiscrepancy !== 0 ? '#fee2e2' : '#f1f5f9', color: metrics.totalDiscrepancy !== 0 ? '#dc2626' : '#64748b', padding: '6px', borderRadius: '8px' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: metrics.totalDiscrepancy > 0 ? '#dc2626' : (metrics.totalDiscrepancy < 0 ? '#ea580c' : '#0f172a') }}>
            {metrics.totalDiscrepancy > 0 ? `+₹${metrics.totalDiscrepancy.toLocaleString('en-IN')}` : (metrics.totalDiscrepancy < 0 ? `-₹${Math.abs(metrics.totalDiscrepancy).toLocaleString('en-IN')}` : '₹0.00')}
          </div>
          <div style={{ fontSize: '12px', color: metrics.discrepancyCount > 0 ? '#dc2626' : '#64748b', fontWeight: metrics.discrepancyCount > 0 ? '600' : '400' }}>
            {metrics.discrepancyCount > 0 ? `${metrics.discrepancyCount} discrepancy flags detected` : 'Perfect cash balance'}
          </div>
        </div>

        {/* Card 4: Pending Verification */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Pending Store Response</span>
            <div style={{ background: '#fef3c7', color: '#d97706', padding: '6px', borderRadius: '8px' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#d97706' }}>
            {metrics.pendingCount}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Settlement Rate: <strong>{metrics.settlementRate}%</strong>
          </div>
        </div>

      </div>

      {/* Agent-Wise Breakup Summary Table */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={18} color="#0284c7" /> Field Agent-Wise Cash Collection Summary
        </h3>

        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Agent Name</th>
                <th>Phone</th>
                <th style={{ textAlign: 'center' }}>Jobs Count</th>
                <th style={{ textAlign: 'right' }}>Total Cash Collected</th>
                <th style={{ textAlign: 'right' }}>Store Verified</th>
                <th style={{ textAlign: 'right' }}>Variance</th>
                <th style={{ textAlign: 'center' }}>Handovers (Pending / Total)</th>
              </tr>
            </thead>
            <tbody>
              {agentWiseBreakup.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>
                    No agent collection records matching this period filter.
                  </td>
                </tr>
              ) : (
                agentWiseBreakup.map(item => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: '600', color: '#0f172a' }}>{item.name}</td>
                    <td>{item.phone}</td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.completedJobs}</td>
                    <td style={{ textAlign: 'right', fontWeight: '700', color: '#0284c7' }}>
                      ₹{item.totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '700', color: '#16a34a' }}>
                      ₹{item.totalAcknowledged.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '700', color: item.totalDiscrepancy !== 0 ? '#dc2626' : '#64748b' }}>
                      {item.totalDiscrepancy !== 0 ? `₹${item.totalDiscrepancy.toLocaleString('en-IN')}` : '₹0.00'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {item.pendingHandovers > 0 ? (
                        <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                          {item.pendingHandovers} Pending / {item.handoverCount} Total
                        </span>
                      ) : (
                        <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                          All Settled ({item.handoverCount})
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive Detailed Handover Ledger with Store In-Charge Response */}
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Store size={18} color="#059669" /> Daily Cash Handovers & Store In-Charge Response Audit Ledger
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            <RefreshCw className="spin" size={24} style={{ margin: '0 auto 10px auto' }} />
            <p>Loading financial records...</p>
          </div>
        ) : error ? (
          <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '16px', borderRadius: '8px', border: '1px solid #fecaca' }}>
            {error}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date & Handover</th>
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
                      No handover records found matching the active filters.
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

                        {/* Expanded Sub-Table showing the completed service requests for this handover */}
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
        )}
      </div>
    </div>
  );
};

export default AdminPaymentsTab;
