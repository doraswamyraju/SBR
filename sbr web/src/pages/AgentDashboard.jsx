import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { 
  LayoutDashboard, 
  Wrench, 
  CheckCircle, 
  MapPin, 
  Upload, 
  LogOut, 
  RefreshCw,
  Navigation,
  Compass,
  Check,
  DollarSign,
  AlertCircle,
  User,
  Users,
  Package,
  AlertTriangle,
  Plus
} from 'lucide-react';
import OurCustomersTab from '../components/OurCustomersTab';
import './Dashboard.css';

const AgentDashboard = ({ initialTab, handleNavigation }) => {
  const { user, logout, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab || 'jobs');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const switchTab = (tabName) => {
    handleNavigation({ pageId: 'agent-dashboard', tab: tabName });
  };
  
  // Tracking Simulation State
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [trackingCoordinates, setTrackingCoordinates] = useState({ lat: 12.9716, lng: 77.5946 });
  const trackingIntervalRef = useRef(null);

  // File Upload / Complete Job States
  const [uploadingBefore, setUploadingBefore] = useState(false);
  const [uploadingAfter, setUploadingAfter] = useState(false);
  const [completingRequestId, setCompletingRequestId] = useState(null);
  
  // Completion form state
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [completionLoading, setCompletionLoading] = useState(false);
  const [completionError, setCompletionError] = useState('');

  // EOD Cash Handover state
  const [dailyCashSummary, setDailyCashSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [handoverNotes, setHandoverNotes] = useState('');
  const [submittingHandover, setSubmittingHandover] = useState(false);
  const [handoverSuccessMsg, setHandoverSuccessMsg] = useState('');
  const [handoverErrorMsg, setHandoverErrorMsg] = useState('');
  const [myHandovers, setMyHandovers] = useState([]);

  const fetchDailyCashSummary = async () => {
    setLoadingSummary(true);
    try {
      const [sumRes, myRes] = await Promise.all([
        api.get('api/handovers/agent-daily-summary'),
        api.get('api/handovers/my-submissions')
      ]);
      if (sumRes.success) setDailyCashSummary(sumRes.data);
      if (myRes.success) setMyHandovers(myRes.data || []);
    } catch (err) {
      console.error('Failed to load daily cash summary:', err);
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'cash-handover') {
      fetchDailyCashSummary();
    }
  }, [activeTab]);

  const handleSubmitHandover = async (e) => {
    e.preventDefault();
    if (!dailyCashSummary) return;
    setSubmittingHandover(true);
    setHandoverErrorMsg('');
    setHandoverSuccessMsg('');
    try {
      const res = await api.post('api/handovers/submit', {
        date: dailyCashSummary.date,
        totalCollectedCash: dailyCashSummary.totalCash,
        completedRequestIds: (dailyCashSummary.completedRequests || []).map(r => r._id),
        agentNotes: handoverNotes
      });
      if (res.success) {
        setHandoverSuccessMsg('Cash handover submitted successfully to Store In-Charge!');
        await fetchDailyCashSummary();
      }
    } catch (err) {
      setHandoverErrorMsg(err.message || 'Failed to submit cash handover');
    } finally {
      setSubmittingHandover(false);
    }
  };

  // Van Stock & Indents state
  const [vanInventory, setVanInventory] = useState([]);
  const [loadingVanInventory, setLoadingVanInventory] = useState(false);
  const [myIndents, setMyIndents] = useState([]);
  const [loadingMyIndents, setLoadingMyIndents] = useState(false);
  const [shortageModalData, setShortageModalData] = useState(null);

  // Manual indent modal state
  const [showManualIndentModal, setShowManualIndentModal] = useState(false);
  const [manualIndentPartName, setManualIndentPartName] = useState('');
  const [manualIndentQty, setManualIndentQty] = useState(2);
  const [manualIndentRemarks, setManualIndentRemarks] = useState('');
  const [submittingManualIndent, setSubmittingManualIndent] = useState(false);

  const fetchVanStockAndIndents = async () => {
    setLoadingVanInventory(true);
    setLoadingMyIndents(true);
    try {
      const [invRes, indRes] = await Promise.all([
        api.get('api/agent-inventory/my-stock'),
        api.get('api/indents/my-indents')
      ]);
      if (invRes.success) setVanInventory(invRes.data || []);
      if (indRes.success) setMyIndents(indRes.data || []);
    } catch (err) {
      console.error('Failed to load van stock or indents:', err);
    } finally {
      setLoadingVanInventory(false);
      setLoadingMyIndents(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'van-stock') {
      fetchVanStockAndIndents();
    }
  }, [activeTab]);

  const handleRaiseIndentFromShortage = async () => {
    if (!shortageModalData) return;
    try {
      const items = shortageModalData.missingComponents.map(c => ({
        posProductId: c.posProductId,
        productName: c.name,
        sku: c.sku,
        requestedQuantity: c.shortageQuantity || c.requiredQuantity || 1
      }));
      const res = await api.post('api/indents/create', {
        serviceRequestId: shortageModalData.requestId,
        items,
        agentRemarks: `Auto-generated indent for missing parts to accept service #${shortageModalData.requestId}`
      });
      if (res.success) {
        alert('Indent request successfully submitted to Store In-Charge! You will be notified once parts are dispatched.');
        setShortageModalData(null);
      }
    } catch (err) {
      alert(err.message || 'Failed to raise indent');
    }
  };

  const handleManualIndentSubmit = async (e) => {
    e.preventDefault();
    if (!manualIndentPartName || manualIndentQty <= 0) return;
    setSubmittingManualIndent(true);
    try {
      const res = await api.post('api/indents/create', {
        items: [{ productName: manualIndentPartName, requestedQuantity: Number(manualIndentQty) }],
        agentRemarks: manualIndentRemarks
      });
      if (res.success) {
        alert('Parts requisition indent submitted to Store In-Charge!');
        setShowManualIndentModal(false);
        setManualIndentPartName('');
        setManualIndentQty(2);
        setManualIndentRemarks('');
        await fetchVanStockAndIndents();
      }
    } catch (err) {
      alert(err.message || 'Failed to submit indent');
    } finally {
      setSubmittingManualIndent(false);
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('api/requests');
      if (res.success) {
        setRequests(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch assigned jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Cleanup tracking timer on unmount
  useEffect(() => {
    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, []);

  const handleUpdateStatus = async (requestId, status) => {
    try {
      const res = await api.put(`api/requests/${requestId}/status`, { status });
      if (res.success) {
        setRequests(requests.map(req => 
          req._id === requestId ? { ...req, status, acceptedAt: status === 'Accepted' ? new Date() : req.acceptedAt } : req
        ));
      }
    } catch (err) {
      if (err.stockShortage && err.missingComponents) {
        setShortageModalData({
          requestId,
          missingComponents: err.missingComponents,
          message: err.message
        });
      } else {
        alert(err.message || 'Failed to update job status');
      }
    }
  };

  const handleImageUpload = async (e, requestId, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (type === 'before') setUploadingBefore(true);
    if (type === 'after') setUploadingAfter(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      // 1. Post to upload endpoint
      const uploadRes = await api.post('api/upload', formData);
      if (!uploadRes.success || !uploadRes.url) {
        throw new Error('Upload failed to return file URL');
      }

      // 2. Link image to request
      const linkRes = await api.put(`api/requests/${requestId}/image`, {
        imageUrl: uploadRes.url,
        imageType: type
      });

      if (linkRes.success) {
        setRequests(requests.map(req => 
          req._id === requestId 
            ? { ...req, [type === 'before' ? 'beforeImageUrl' : 'afterImageUrl']: uploadRes.url } 
            : req
        ));
        alert(`${type === 'before' ? 'Before' : 'After'} service image uploaded successfully!`);
      }
    } catch (err) {
      alert(err.message || 'Image upload failed');
    } finally {
      setUploadingBefore(false);
      setUploadingAfter(false);
    }
  };

  const handleCompleteJobSubmit = async (e) => {
    e.preventDefault();
    setCompletionLoading(true);
    setCompletionError('');

    try {
      const parsedAmount = parseFloat(paymentAmount) || 0;

      // 1. Post payment details
      const paymentRes = await api.put(`api/requests/${completingRequestId}/payment`, {
        amount: parsedAmount,
        method: paymentMethod
      });

      // 2. Update status to completed
      if (paymentRes.success) {
        const statusRes = await api.put(`api/requests/${completingRequestId}/status`, {
          status: 'Completed'
        });

        if (statusRes.success) {
          // Increment completed jobs count local display
          const updatedUser = { ...user, completedJobs: (user.completedJobs || 0) + 1 };
          setUser(updatedUser);
          localStorage.setItem('auth_user', JSON.stringify(updatedUser));

          setCompletingRequestId(null);
          setPaymentAmount('');
          setPaymentMethod('Cash');
          fetchJobs();
          alert('Job marked as Completed and payment details recorded!');
        }
      }
    } catch (err) {
      setCompletionError(err.message || 'Failed to complete job');
    } finally {
      setCompletionLoading(false);
    }
  };

  // Mock Location Broadcaster Simulation
  const toggleLocationBroadcast = (activeJobId) => {
    if (isTrackingActive) {
      // Turn Off
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
        trackingIntervalRef.current = null;
      }
      setIsTrackingActive(false);
      
      // Update Agent Profile status to offline/not-broadcasting
      api.put('api/users/profile', { status: 'Offline' }).then(res => {
        if (res.success) {
          const updatedUser = { ...user, status: 'Offline' };
          setUser(updatedUser);
          localStorage.setItem('auth_user', JSON.stringify(updatedUser));
        }
      });
    } else {
      // Turn On
      setIsTrackingActive(true);
      
      // Set status online
      api.put('api/users/profile', { status: 'Online' }).then(res => {
        if (res.success) {
          const updatedUser = { ...user, status: 'Online' };
          setUser(updatedUser);
          localStorage.setItem('auth_user', JSON.stringify(updatedUser));
        }
      });

      let currentSeedLat = 12.9716; // Bangalore Center seed
      let currentSeedLng = 77.5946;

      // Update location immediately
      sendLocationUpdate(activeJobId, currentSeedLat, currentSeedLng);

      // Periodically update coordinates with a random walk simulation to show trace paths
      trackingIntervalRef.current = setInterval(() => {
        // Random walking simulator: moves 0.001 degrees each step
        currentSeedLat += (Math.random() - 0.5) * 0.002;
        currentSeedLng += (Math.random() - 0.5) * 0.002;
        setTrackingCoordinates({ lat: currentSeedLat, lng: currentSeedLng });

        sendLocationUpdate(activeJobId, currentSeedLat, currentSeedLng);
      }, 10000); // broad cast coordinates every 10 seconds
    }
  };

  const sendLocationUpdate = async (activeJobId, lat, lng) => {
    try {
      // 1. Update overall agent coordinates
      await api.put('api/users/agent/location', { latitude: lat, longitude: lng });

      // 2. Append to active service requests' locationPath
      if (activeJobId) {
        await api.post(`api/requests/${activeJobId}/location`, { latitude: lat, longitude: lng });
      }
    } catch (err) {
      console.error('GPS broadcast error: ', err);
    }
  };

  const handleLogout = () => {
    if (isTrackingActive && trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
    }
    logout();
    handleNavigation('auth');
  };

  const assignedJobs = requests.filter(r => r.status === 'Assigned');
  const activeJobs = requests.filter(r => ['Accepted', 'In Progress'].includes(r.status));
  const completedJobs = requests.filter(r => r.status === 'Completed');

  // Finding first job that is active to bind GPS tracker simulator
  const activeJobForGPS = activeJobs[0]?._id || null;

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">SBR AGENT</div>
        
        {/* GPS Broadcast Control widget in sidebar */}
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '15px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Compass className={isTrackingActive ? 'animate-spin' : ''} size={16} style={{ color: isTrackingActive ? '#10b981' : '#9ca3af' }} />
            <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Mock GPS Broadcast</span>
          </div>
          <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 10px 0' }}>
            {isTrackingActive 
              ? `Broadcasting: ${trackingCoordinates.lat.toFixed(4)}, ${trackingCoordinates.lng.toFixed(4)}` 
              : 'Broadcast coordinates to allow live tracking from Admin Panel.'
            }
          </p>
          <button 
            type="button" 
            className={`btn-secondary ${isTrackingActive ? 'btn-danger' : ''}`}
            style={{ width: '100%', padding: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
            onClick={() => toggleLocationBroadcast(activeJobForGPS)}
          >
            <Navigation size={12} /> {isTrackingActive ? 'Stop Broadcasting' : 'Start Broadcasting'}
          </button>
        </div>

        <div className="sidebar-menu">
          <button 
            className={`menu-item ${activeTab === 'jobs' ? 'active' : ''}`}
            onClick={() => switchTab('jobs')}
          >
            <Wrench size={18} /> Active Jobs ({activeJobs.length + assignedJobs.length})
          </button>
          <button 
            className={`menu-item ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => switchTab('completed')}
          >
            <CheckCircle size={18} /> Completed ({completedJobs.length})
          </button>
          <button 
            className={`menu-item ${activeTab === 'cash-handover' ? 'active' : ''}`}
            onClick={() => switchTab('cash-handover')}
          >
            <DollarSign size={18} /> EOD Cash Handover
          </button>
          <button 
            className={`menu-item ${activeTab === 'van-stock' ? 'active' : ''}`}
            onClick={() => switchTab('van-stock')}
          >
            <Package size={18} /> Van Stock & Indents
          </button>
          <button 
            className={`menu-item ${activeTab === 'our-customers' ? 'active' : ''}`}
            onClick={() => switchTab('our-customers')}
          >
            <Users size={18} /> Our Customers
          </button>
          <button 
            className={`menu-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => switchTab('profile')}
          >
            <User size={18} /> My Profile
          </button>
        </div>
        <div style={{ padding: '10px 15px', fontSize: '11px', color: '#9ca3af', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '20px' }}>
          Completed Jobs: <strong>{user?.completedJobs || 0}</strong>
        </div>
        <button className="menu-item logout-btn" onClick={handleLogout}>
          <LogOut size={18} /> Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="main-header">
          <div className="header-info">
            <h1>Agent Portal</h1>
            <p>Welcome, Field Specialist {user?.name}</p>
          </div>
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={fetchJobs}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Sync Tasks
          </button>
        </header>

        {error && <div className="error-banner">{error}</div>}

        {activeTab === 'jobs' && (
          <>
            {/* New Assigned Jobs */}
            <div className="section-card" style={{ marginBottom: '30px' }}>
              <h2 className="section-title">New Job Offers Awaiting Acceptance</h2>
              {loading ? (
                <div style={{ color: '#9ca3af' }}>Loading jobs...</div>
              ) : assignedJobs.length === 0 ? (
                <div style={{ color: '#9ca3af', fontSize: '14px' }}>No new service assignments. Check back later.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {assignedJobs.map(job => (
                    <div 
                      key={job._id}
                      style={{ 
                        background: 'rgba(255, 255, 255, 0.02)', 
                        border: '1px solid rgba(255, 255, 255, 0.06)', 
                        borderRadius: '12px', 
                        padding: '20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '15px'
                      }}
                    >
                      <div>
                        <span className="badge badge-assigned" style={{ marginBottom: '8px' }}>Assigned</span>
                        <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#ffffff' }}>{job.serviceType}</h3>
                        <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#d1d5db' }}>{job.description}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#9ca3af' }}>
                          <MapPin size={14} /> Address: {job.customerAddress}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                          className="btn-primary" 
                          style={{ padding: '8px 18px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: 'none' }}
                          onClick={() => handleUpdateStatus(job._id, 'Accepted')}
                        >
                          Accept Offer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Execution Jobs */}
            <div className="section-card">
              <h2 className="section-title">Jobs in Progress</h2>
              {activeJobs.length === 0 ? (
                <div style={{ color: '#9ca3af', fontSize: '14px' }}>No active service tasks. Accept an assignment above to start.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {activeJobs.map(job => (
                    <div 
                      key={job._id}
                      style={{ 
                        background: 'rgba(99, 102, 241, 0.03)', 
                        border: '1px solid rgba(99, 102, 241, 0.1)', 
                        borderRadius: '16px', 
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '15px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <span className={`badge badge-${job.status.toLowerCase().replace(' ', '-')}`}>
                            {job.status}
                          </span>
                          <h3 style={{ margin: '8px 0 6px 0', fontSize: '18px', color: '#ffffff' }}>{job.serviceType}</h3>
                          <p style={{ margin: '0 0 6px 0', color: '#d1d5db', fontSize: '14px' }}>{job.description}</p>
                          
                          <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '10px' }}>
                            <div>Client Name: <strong>{job.customerId?.name}</strong></div>
                            <div>Phone: <strong>{job.customerId?.phone}</strong></div>
                            <div>Location: <strong>{job.customerAddress}</strong></div>
                          </div>
                        </div>

                        {/* Controls */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '160px' }}>
                          {job.status === 'Accepted' && (
                            <button 
                              className="btn-primary" 
                              onClick={() => handleUpdateStatus(job._id, 'In Progress')}
                            >
                              Start Service Job
                            </button>
                          )}
                          
                          {job.status === 'In Progress' && (
                            <button 
                              className="btn-primary" 
                              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: 'none' }}
                              onClick={() => setCompletingRequestId(job._id)}
                            >
                              Mark Completed
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Image Upload Row */}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px', marginTop: '10px' }}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#9ca3af', textTransform: 'uppercase' }}>Service Quality Documentation</h4>
                        
                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                          {/* Before Photo Upload */}
                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <span style={{ fontSize: '12px', display: 'block', marginBottom: '8px', color: '#d1d5db' }}>Before Image:</span>
                            {job.beforeImageUrl ? (
                              <img src={job.beforeImageUrl} alt="Before Service" className="photo-preview" />
                            ) : (
                              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.15)', padding: '20px', borderRadius: '8px', cursor: 'pointer' }}>
                                <Upload size={20} style={{ color: '#9ca3af', marginBottom: '6px' }} />
                                <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                                  {uploadingBefore ? 'Uploading...' : 'Choose Before Photo'}
                                </span>
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  style={{ display: 'none' }} 
                                  onChange={(e) => handleImageUpload(e, job._id, 'before')}
                                  disabled={uploadingBefore}
                                />
                              </label>
                            )}
                          </div>

                          {/* After Photo Upload */}
                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <span style={{ fontSize: '12px', display: 'block', marginBottom: '8px', color: '#d1d5db' }}>After Image:</span>
                            {job.afterImageUrl ? (
                              <img src={job.afterImageUrl} alt="After Service" className="photo-preview" />
                            ) : (
                              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.15)', padding: '20px', borderRadius: '8px', cursor: 'pointer' }}>
                                <Upload size={20} style={{ color: '#9ca3af', marginBottom: '6px' }} />
                                <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                                  {uploadingAfter ? 'Uploading...' : 'Choose After Photo'}
                                </span>
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  style={{ display: 'none' }} 
                                  onChange={(e) => handleImageUpload(e, job._id, 'after')}
                                  disabled={uploadingAfter}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'completed' && (
          <div className="section-card">
            <h2 className="section-title">Job Service Logs</h2>
            <div className="table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Job ID</th>
                    <th>Customer</th>
                    <th>Service Provided</th>
                    <th>Date Resolved</th>
                    <th>Revenue Collected</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {completedJobs.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: '#9ca3af', padding: '30px' }}>No completed history found.</td>
                    </tr>
                  ) : (
                    completedJobs.map(job => (
                      <tr key={job._id}>
                        <td style={{ fontSize: '11px', color: '#9ca3af' }}>#{job._id.substring(job._id.length - 8)}</td>
                        <td>
                          <div style={{ fontWeight: '600' }}>{job.customerId?.name || 'Customer'}</div>
                          <div style={{ fontSize: '11px', color: '#9ca3af' }}>{job.customerId?.phone}</div>
                        </td>
                        <td style={{ fontWeight: '600', color: '#a78bfa' }}>{job.serviceType}</td>
                        <td>{job.completedAt ? new Date(job.completedAt).toLocaleDateString() : new Date(job.updatedAt).toLocaleDateString()}</td>
                        <td style={{ fontWeight: 'bold', color: '#10b981' }}>₹{job.paymentAmount || 0}</td>
                        <td>
                          <span className="badge badge-completed">Completed</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="section-card">
            <h2 className="section-title">My Profile & Availability</h2>
            
            <div className="profile-details-card" style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa', fontSize: '24px', fontWeight: 'bold' }}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'white' }}>{user?.name}</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#9ca3af' }}>{user?.email}</p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '14px' }}>
                <div>
                  <span style={{ color: '#9ca3af', display: 'block', fontSize: '12px', marginBottom: '4px' }}>Phone Number</span>
                  <strong>{user?.phone || 'Not Provided'}</strong>
                </div>
                <div>
                  <span style={{ color: '#9ca3af', display: 'block', fontSize: '12px', marginBottom: '4px' }}>Specialization</span>
                  <strong>{user?.specialization || 'General Technician'}</strong>
                </div>
                <div>
                  <span style={{ color: '#9ca3af', display: 'block', fontSize: '12px', marginBottom: '4px' }}>Location Scope</span>
                  <strong>{user?.location || 'Tirupati Region'}</strong>
                </div>
                <div>
                  <span style={{ color: '#9ca3af', display: 'block', fontSize: '12px', marginBottom: '4px' }}>Total Completed Jobs</span>
                  <strong>{user?.completedJobs || 0} jobs</strong>
                </div>
              </div>
            </div>

            <div className="availability-card" style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: '600', color: 'white' }}>Work Availability Status</h3>
              <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: '#9ca3af' }}>
                Toggle your availability status. When Offline, the administrator will not assign you new service requests.
              </p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="button"
                  onClick={async () => {
                    const nextStatus = user?.status === 'Online' ? 'Offline' : 'Online';
                    try {
                      const res = await api.put('api/users/profile', { status: nextStatus });
                      if (res.success) {
                        const updatedUser = { ...user, status: nextStatus };
                        setUser(updatedUser);
                        localStorage.setItem('auth_user', JSON.stringify(updatedUser));
                        alert(`You are now ${nextStatus}!`);
                      }
                    } catch (e) {
                      alert('Failed to update availability status.');
                    }
                  }}
                  style={{
                    padding: '8px 20px',
                    fontSize: '13px',
                    borderRadius: '8px',
                    background: user?.status === 'Online' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: user?.status === 'Online' ? '#10b981' : '#f87171',
                    border: user?.status === 'Online' ? '1px solid #10b981' : '1px solid #ef4444',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Status: {user?.status || 'Offline'}
                </button>
                <span style={{ fontSize: '13px', color: '#9ca3af' }}>
                  {user?.status === 'Online' ? '🟢 You are ready to accept new service requests.' : '🔴 You will not receive any new requests.'}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 style={{ color: '#ef4444', fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>Danger Zone</h3>
              <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '15px' }}>
                Permanently delete your account and all associated personal data. This action is irreversible.
              </p>
              <button
                type="button"
                onClick={async () => {
                  const confirmDelete = window.confirm(
                    "WARNING: Are you absolutely sure you want to permanently delete your agent account? This will erase all your profile data and cannot be undone."
                  );
                  if (confirmDelete) {
                    try {
                      const res = await api.delete('api/users/profile');
                      if (res.success) {
                        alert("Your account has been successfully deleted.");
                        handleLogout();
                      }
                    } catch (err) {
                      alert(err.message || "Failed to delete account. Please try again.");
                    }
                  }
                }}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  transition: 'all 0.2s ease'
                }}
              >
                Delete Account
              </button>
            </div>
          </div>
        )}
        {activeTab === 'our-customers' && (
          <OurCustomersTab />
        )}

        {/* EOD Cash Handover Tab */}
        {activeTab === 'cash-handover' && (
          <div className="tab-content" style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#ffffff' }}>
                  End-of-Day (EOD) Cash Handover
                </h2>
                <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>
                  Reconcile and submit cash collected from today's completed service jobs to Store In-Charge.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchDailyCashSummary}
                className="btn-secondary"
                style={{ padding: '8px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={14} className={loadingSummary ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>

            {loadingSummary ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Calculating daily cash summary...</div>
            ) : (
              <div>
                {/* Daily Summary Card */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.1) 100%)',
                  border: '1px solid rgba(129, 140, 248, 0.25)',
                  borderRadius: '16px',
                  padding: '20px',
                  marginBottom: '25px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '15px'
                }}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#a5b4fc', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Today's Cash Collection ({dailyCashSummary?.date || 'Today'})
                    </span>
                    <h3 style={{ fontSize: '32px', fontWeight: '900', color: '#ffffff', margin: '5px 0' }}>
                      ₹{dailyCashSummary?.totalCash || 0}
                    </h3>
                    <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0 }}>
                      {dailyCashSummary?.requestCount || 0} Cash payment job(s) completed today
                    </p>
                  </div>

                  <div>
                    {dailyCashSummary?.alreadySubmitted ? (
                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          background: dailyCashSummary.handoverStatus === 'ACKNOWLEDGED'
                            ? 'rgba(16, 185, 129, 0.2)'
                            : dailyCashSummary.handoverStatus === 'DISCREPANCY'
                            ? 'rgba(239, 68, 68, 0.2)'
                            : 'rgba(168, 85, 247, 0.2)',
                          color: dailyCashSummary.handoverStatus === 'ACKNOWLEDGED'
                            ? '#34d399'
                            : dailyCashSummary.handoverStatus === 'DISCREPANCY'
                            ? '#f87171'
                            : '#c084fc',
                          border: '1px solid currentColor'
                        }}>
                          {dailyCashSummary.handoverStatus === 'ACKNOWLEDGED' ? '✓ Reconciled & Acknowledged' : dailyCashSummary.handoverStatus === 'DISCREPANCY' ? '⚠ Discrepancy Flagged' : '⏳ Submitted (Pending In-Charge)'}
                        </span>
                        {dailyCashSummary.existingHandover?.acknowledgedAmount !== null && dailyCashSummary.existingHandover?.acknowledgedAmount !== undefined && (
                          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
                            Acknowledged: <strong>₹{dailyCashSummary.existingHandover.acknowledgedAmount}</strong>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{
                        display: 'inline-block',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        background: 'rgba(245, 158, 11, 0.2)',
                        color: '#fbbf24',
                        border: '1px solid rgba(245, 158, 11, 0.4)'
                      }}>
                        Pending Submission
                      </span>
                    )}
                  </div>
                </div>

                {handoverSuccessMsg && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', marginBottom: '20px' }}>
                    {handoverSuccessMsg}
                  </div>
                )}

                {handoverErrorMsg && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', marginBottom: '20px' }}>
                    {handoverErrorMsg}
                  </div>
                )}

                {/* Submission Form (Only if not already acknowledged) */}
                {(!dailyCashSummary?.alreadySubmitted || dailyCashSummary?.handoverStatus === 'SUBMITTED') && (
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '20px', marginBottom: '25px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff', margin: '0 0 15px 0' }}>
                      {dailyCashSummary?.alreadySubmitted ? 'Update Handover Notes' : 'Submit Handover to Store In-Charge'}
                    </h4>

                    {dailyCashSummary?.completedRequests && dailyCashSummary.completedRequests.length > 0 ? (
                      <div style={{ marginBottom: '15px' }}>
                        <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>Jobs included in this batch:</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                          {dailyCashSummary.completedRequests.map((r) => (
                            <div key={r._id} style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '12px' }}>
                              <div style={{ fontWeight: 'bold', color: '#ffffff' }}>{r.serviceType}</div>
                              <div style={{ color: '#94a3b8', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.customerAddress}</div>
                              <div style={{ color: '#34d399', fontWeight: 'bold', marginTop: '4px' }}>₹{r.paymentAmount}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '15px' }}>
                        No completed cash jobs logged today. You can still submit ₹0 or manual collection.
                      </p>
                    )}

                    <form onSubmit={handleSubmitHandover}>
                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px' }}>
                          Notes / Handover Remarks (Optional)
                        </label>
                        <textarea
                          rows="2"
                          value={handoverNotes}
                          onChange={(e) => setHandoverNotes(e.target.value)}
                          placeholder="e.g. Submitted at central desk, ₹500 x 2 notes..."
                          style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', outline: 'none', fontSize: '13px' }}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingHandover}
                        className="btn-primary"
                        style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', boxShadow: 'none' }}
                      >
                        {submittingHandover ? 'Submitting...' : dailyCashSummary?.alreadySubmitted ? 'Update Submission' : 'Submit EOD Cash Collection'}
                      </button>
                    </form>
                  </div>
                )}

                {/* Past Submissions History */}
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff', margin: '0 0 15px 0' }}>
                    My Past Handover Submissions
                  </h4>

                  {myHandovers.length === 0 ? (
                    <p style={{ color: '#9ca3af', fontSize: '13px' }}>No previous submissions recorded.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {myHandovers.map((h) => (
                        <div key={h._id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                          <div>
                            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#ffffff' }}>{h.date}</span>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                              Declared: <strong>₹{h.totalCollectedCash}</strong>
                              {h.acknowledgedAmount !== null && ` | Received: ₹${h.acknowledgedAmount}`}
                            </div>
                            {h.inchargeNotes && (
                              <div style={{ fontSize: '11px', color: '#a5b4fc', marginTop: '4px', fontStyle: 'italic' }}>
                                In-Charge: "{h.inchargeNotes}"
                              </div>
                            )}
                          </div>

                          <div>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              background: h.status === 'ACKNOWLEDGED'
                                ? 'rgba(16, 185, 129, 0.2)'
                                : h.status === 'DISCREPANCY'
                                ? 'rgba(239, 68, 68, 0.2)'
                                : 'rgba(168, 85, 247, 0.2)',
                              color: h.status === 'ACKNOWLEDGED'
                                ? '#34d399'
                                : h.status === 'DISCREPANCY'
                                ? '#f87171'
                                : '#c084fc'
                            }}>
                              {h.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Van Stock & Indents Tab */}
        {activeTab === 'van-stock' && (
          <div className="tab-content" style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#ffffff' }}>
                  Van Stock & Spare Parts
                </h2>
                <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>
                  Manage items carried in your vehicle kit and request stock refills from Store In-Charge.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowManualIndentModal(true)}
                  className="btn-primary"
                  style={{ padding: '8px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', boxShadow: 'none' }}
                >
                  <Plus size={14} /> Request Parts Indent
                </button>
                <button
                  type="button"
                  onClick={fetchVanStockAndIndents}
                  className="btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <RefreshCw size={14} className={loadingVanInventory ? 'animate-spin' : ''} /> Refresh
                </button>
              </div>
            </div>

            {loadingVanInventory ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Loading your van stock...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                {/* Current Van Stock Grid */}
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '12px' }}>
                    Current Kit Inventory ({vanInventory.length} Items)
                  </h3>

                  {vanInventory.length === 0 ? (
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', padding: '30px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                      <Package size={28} style={{ color: '#6366f1', margin: '0 auto 10px auto' }} />
                      <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#ffffff' }}>Your van inventory is currently empty</p>
                      <p style={{ margin: 0 }}>Use "Request Parts Indent" or ask Store In-Charge to allocate stock.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px' }}>
                      {vanInventory.map((item) => {
                        const isLow = item.quantity <= item.minThreshold;
                        return (
                          <div
                            key={item._id}
                            style={{
                              background: 'rgba(255,255,255,0.03)',
                              border: isLow ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(255,255,255,0.06)',
                              borderRadius: '12px',
                              padding: '15px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between'
                            }}
                          >
                            <div>
                              <span style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase' }}>{item.category || 'Spare Part'}</span>
                              <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffffff', margin: '4px 0 8px 0' }}>{item.productName}</h4>
                              {item.sku && <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>SKU: {item.sku}</p>}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '15px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                              <div>
                                <span style={{ fontSize: '11px', color: '#9ca3af' }}>Stock:</span>
                                <span style={{ fontSize: '20px', fontWeight: 'bold', color: isLow ? '#fbbf24' : '#34d399', marginLeft: '6px' }}>{item.quantity}</span>
                              </div>
                              {isLow && (
                                <span style={{ fontSize: '10px', fontWeight: 'bold', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '2px 6px', borderRadius: '4px' }}>
                                  Low Stock
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* My Indent Requisitions History */}
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '12px' }}>
                    My Indent Requisitions
                  </h3>

                  {myIndents.length === 0 ? (
                    <p style={{ color: '#9ca3af', fontSize: '13px' }}>No indent requests submitted yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {myIndents.map((ind) => (
                        <div
                          key={ind._id}
                          style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: '12px',
                            padding: '15px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '10px'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#ffffff' }}>
                                {new Date(ind.requestedAt).toLocaleDateString()}
                              </span>
                              {ind.serviceRequestId && (
                                <span style={{ fontSize: '11px', color: '#818cf8', background: 'rgba(99, 102, 241, 0.15)', padding: '2px 8px', borderRadius: '10px' }}>
                                  Job: {ind.serviceRequestId.serviceType}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
                              Parts: {ind.items?.map(it => `${it.productName} (x${it.requestedQuantity})`).join(', ')}
                            </div>
                            {ind.inchargeRemarks && (
                              <div style={{ fontSize: '11px', color: '#34d399', marginTop: '4px', fontStyle: 'italic' }}>
                                Store: "{ind.inchargeRemarks}"
                              </div>
                            )}
                          </div>

                          <div>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              background: ind.status === 'DISPATCHED'
                                ? 'rgba(16, 185, 129, 0.2)'
                                : ind.status === 'REJECTED'
                                ? 'rgba(239, 68, 68, 0.2)'
                                : 'rgba(245, 158, 11, 0.2)',
                              color: ind.status === 'DISPATCHED'
                                ? '#34d399'
                                : ind.status === 'REJECTED'
                                ? '#f87171'
                                : '#fbbf24'
                            }}>
                              {ind.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* SHORTAGE MODAL (PRE-ACCEPTANCE INTERCEPT) */}
      {shortageModalData && (
        <div className="modal-backdrop" onClick={() => setShortageModalData(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '10px', borderRadius: '12px' }}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#ffffff' }}>Insufficient Van Kit Inventory</h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>You lack spare parts to accept this service request.</p>
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '12px', padding: '15px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#e2e8f0', marginBottom: '10px' }}>Required vs Available Stock:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {shortageModalData.missingComponents.map((comp, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    <span style={{ color: '#ffffff', fontWeight: '500' }}>{comp.name}</span>
                    <span style={{ color: '#f87171', fontWeight: 'bold' }}>
                      Need {comp.requiredQuantity} (Have: {comp.availableQuantity})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '20px' }}>
              Clicking below will automatically submit an indent to the Store In-Charge. Once approved and dispatched, you will be able to accept this job.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ flex: 1, padding: '10px', fontSize: '13px' }}
                onClick={() => setShortageModalData(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ flex: 1.5, padding: '10px', fontSize: '13px', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', boxShadow: 'none' }}
                onClick={handleRaiseIndentFromShortage}
              >
                Raise Indent to Store
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL INDENT CREATION MODAL */}
      {showManualIndentModal && (
        <div className="modal-backdrop" onClick={() => setShowManualIndentModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#ffffff' }}>Request Spare Parts Indent</h3>
              <button
                type="button"
                style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
                onClick={() => setShowManualIndentModal(false)}
              >
                <AlertCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleManualIndentSubmit} className="dashboard-form">
              <div className="input-group">
                <label>Part / Component Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10 inch Spun Filter, RO Pump 75 GPD"
                  value={manualIndentPartName}
                  onChange={(e) => setManualIndentPartName(e.target.value)}
                  style={{ background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', outline: 'none' }}
                />
              </div>

              <div className="input-group">
                <label>Requested Quantity *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={manualIndentQty}
                  onChange={(e) => setManualIndentQty(e.target.value)}
                  style={{ background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', outline: 'none' }}
                />
              </div>

              <div className="input-group">
                <label>Reason / Remarks (Optional)</label>
                <textarea
                  rows="2"
                  value={manualIndentRemarks}
                  onChange={(e) => setManualIndentRemarks(e.target.value)}
                  placeholder="e.g. Daily refill for regular maintenance kit"
                  style={{ background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', outline: 'none', fontSize: '12px' }}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={submittingManualIndent}
                style={{ marginTop: '10px', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', boxShadow: 'none' }}
              >
                {submittingManualIndent ? 'Submitting Indent...' : 'Submit Indent to Store'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Complete Job & Record Payment Modal */}
      {completingRequestId && (
        <div className="modal-backdrop" onClick={() => setCompletingRequestId(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#ffffff' }}>Record Payment & Close Job</h3>
              <button 
                type="button" 
                style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
                onClick={() => setCompletingRequestId(null)}
              >
                <AlertCircle size={20} />
              </button>
            </div>

            {completionError && <div className="error-banner" style={{ marginBottom: '15px' }}>{completionError}</div>}

            <form onSubmit={handleCompleteJobSubmit} className="dashboard-form">
              <div className="input-group">
                <label>Total Payment Collected (INR)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1500"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  style={{ background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', outline: 'none' }}
                />
              </div>

              <div className="input-group">
                <label>Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', outline: 'none' }}
                >
                  <option value="Cash" style={{ background: '#181823' }}>Cash Payment</option>
                  <option value="UPI / Online" style={{ background: '#181823' }}>UPI / Online Payment</option>
                  <option value="Card" style={{ background: '#181823' }}>Debit / Credit Card</option>
                </select>
              </div>

              <div style={{ color: '#9ca3af', fontSize: '12px', marginTop: '5px', padding: '10px', background: 'rgba(255,255,255,0.01)', borderRadius: '6px' }}>
                * Note: Make sure you have uploaded the <strong>After Service photo</strong> on the dashboard before closing this job.
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                disabled={completionLoading}
                style={{ marginTop: '10px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: 'none' }}
              >
                {completionLoading ? 'Completing Job...' : 'Confirm Job Completed'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentDashboard;
