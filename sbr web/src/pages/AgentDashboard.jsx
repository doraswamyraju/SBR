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
  User
} from 'lucide-react';
import './Dashboard.css';

const AgentDashboard = ({ handleNavigation }) => {
  const { user, logout, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('jobs');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
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
      alert(err.message || 'Failed to update job status');
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
    handleNavigation('home');
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
            onClick={() => setActiveTab('jobs')}
          >
            <Wrench size={18} /> Active Jobs ({activeJobs.length + assignedJobs.length})
          </button>
          <button 
            className={`menu-item ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            <CheckCircle size={18} /> Completed ({completedJobs.length})
          </button>
          <button 
            className={`menu-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
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
          </div>
        )}
      </main>

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
