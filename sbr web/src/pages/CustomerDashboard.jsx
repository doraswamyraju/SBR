import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { 
  LayoutDashboard, 
  Wrench, 
  Clock, 
  CreditCard, 
  User, 
  LogOut, 
  PlusCircle, 
  RefreshCw,
  CheckCircle,
  MapPin,
  Calendar
} from 'lucide-react';
import './Dashboard.css';

const CustomerDashboard = ({ handleNavigation }) => {
  const { user, logout, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [requests, setRequests] = useState([]);
  const [requestsFilter, setRequestsFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // New Request Form State
  const [serviceType, setServiceType] = useState('Solar Water Heaters');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState(user?.address || '');
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  // Profile Form State
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileAddress, setProfileAddress] = useState(user?.address || '');
  const [profileIsRecurring, setProfileIsRecurring] = useState(user?.isRecurring || false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  const serviceCategories = [
    'Solar Water Heaters',
    'HM Hard Water Scalenors',
    'Automatic Water Softeners',
    'RO Water Plant Maintenance',
    'Domestic RO Purifier Service',
    'Solar Power Systems Maintenance',
    'Heat Pumps Repairs'
  ];

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('api/requests');
      if (res.success) {
        setRequests(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormSuccess('');
    setFormError('');

    try {
      const res = await api.post('api/requests', {
        serviceType,
        description,
        customerAddress: address
      });

      if (res.success) {
        setFormSuccess('Your service request has been booked successfully! An agent will be assigned shortly.');
        setDescription('');
        fetchRequests(); // Refresh requests lists
        setTimeout(() => setActiveTab('requests'), 1500);
      }
    } catch (err) {
      setFormError(err.message || 'Booking failed. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    try {
      const res = await api.put('api/users/profile', {
        name: profileName,
        phone: profilePhone,
        address: profileAddress,
        isRecurring: profileIsRecurring
      });

      if (res.success) {
        setProfileSuccess('Profile updated successfully!');
        // Update user context state
        const updatedUser = { ...user, ...res.data };
        setUser(updatedUser);
        localStorage.setItem('auth_user', JSON.stringify(updatedUser));
      }
    } catch (err) {
      setProfileError(err.message || 'Profile update failed.');
    }
  };

  const handleLogout = () => {
    logout();
    handleNavigation('home');
  };

  const pendingRequests = requests.filter(r => r.status === 'Pending');
  const activeRequests = requests.filter(r => ['Assigned', 'Accepted', 'In Progress'].includes(r.status));
  const completedRequests = requests.filter(r => r.status === 'Completed');
  
  // Paid requests for transaction history
  const payments = requests.filter(r => r.paymentStatus === 'Paid');

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">Sri Balaji Dashboard</div>
        <div className="sidebar-menu">
          <button 
            className={`menu-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard size={18} /> Overview
          </button>
          <button 
            className={`menu-item ${activeTab === 'book' ? 'active' : ''}`}
            onClick={() => setActiveTab('book')}
          >
            <PlusCircle size={18} /> Book Service
          </button>
          <button 
            className={`menu-item ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            <Wrench size={18} /> Service History
          </button>
          <button 
            className={`menu-item ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            <CreditCard size={18} /> Payments
          </button>
          <button 
            className={`menu-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} /> My Profile
          </button>
        </div>
        <button className="menu-item logout-btn" onClick={handleLogout}>
          <LogOut size={18} /> Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="main-header">
          <div className="header-info">
            <h1>Customer Portal</h1>
            <p>Welcome back, {user?.name}</p>
          </div>
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={fetchRequests}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Sync Status
          </button>
        </header>

        {error && <div className="error-banner">{error}</div>}

        {activeTab === 'overview' && (
          <>
            {/* Quick Metrics */}
            <div className="metrics-grid">
              <div className="metric-card">
                <span className="metric-title">Active Services</span>
                <span className="metric-value">{activeRequests.length}</span>
                <span style={{ fontSize: '12px', color: '#3b82f6' }}>Assigned/Accepted</span>
              </div>
              <div className="metric-card">
                <span className="metric-title">Pending Booking</span>
                <span className="metric-value">{pendingRequests.length}</span>
                <span style={{ fontSize: '12px', color: '#f59e0b' }}>Awaiting Assignment</span>
              </div>
              <div className="metric-card">
                <span className="metric-title">Completed Services</span>
                <span className="metric-value">{completedRequests.length}</span>
                <span style={{ fontSize: '12px', color: '#10b981' }}>Total jobs resolved</span>
              </div>
              <div className="metric-card">
                <span className="metric-title">Recurring Customer</span>
                <span className="metric-value">{user?.isRecurring ? 'YES' : 'NO'}</span>
                <span style={{ fontSize: '12px', color: '#8b5cf6' }}>Service Plan</span>
              </div>
            </div>

            {/* Quick Status View */}
            <div className="section-card">
              <h2 className="section-title">Latest Booking Tracker</h2>
              {loading ? (
                <div style={{ color: '#9ca3af' }}>Loading requests...</div>
              ) : requests.length === 0 ? (
                <div style={{ color: '#9ca3af', padding: '10px 0' }}>
                  No service requests found. Click "Book Service" to submit your first request!
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Service Type</th>
                        <th>Booked Date</th>
                        <th>Assigned Agent</th>
                        <th>Status</th>
                        <th>Payment Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.slice(0, 3).map(req => (
                        <tr key={req._id}>
                          <td style={{ fontWeight: '600' }}>{req.serviceType}</td>
                          <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                          <td>{req.assignedAgentId?.name || 'Awaiting assignment'}</td>
                          <td>
                            <span className={`badge badge-${req.status.toLowerCase().replace(' ', '-')}`}>
                              {req.status}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${req.paymentStatus === 'Paid' ? 'badge-completed' : 'badge-pending'}`}>
                              {req.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'book' && (
          <div className="section-card">
            <h2 className="section-title">Schedule a Service Booking</h2>
            {formSuccess && <div className="success-banner" style={{ marginBottom: '15px', color: '#10b981', padding: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px' }}>{formSuccess}</div>}
            {formError && <div className="error-banner" style={{ marginBottom: '15px' }}>{formError}</div>}

            <form onSubmit={handleBookingSubmit} className="dashboard-form">
              <div className="input-group">
                <label>Select Product / Service category</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  style={{ background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', outline: 'none' }}
                >
                  {serviceCategories.map((cat, idx) => (
                    <option key={idx} value={cat} style={{ background: '#181823' }}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Describe the issue or service requirements</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell us what needs repair or regular maintenance..."
                  rows="4"
                  required
                  style={{ background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div className="input-group">
                <label>Service Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Address where service needs to be done"
                  required
                  style={{ background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', outline: 'none' }}
                />
              </div>

              <button type="submit" className="btn-primary" disabled={formLoading} style={{ marginTop: '10px' }}>
                {formLoading ? 'Booking Service...' : 'Request Service Appointment'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="section-card">
            <h2 className="section-title">All Service Requests</h2>
            
            {/* Status Filter Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {['All', 'Pending', 'Assigned', 'In Progress', 'Completed', 'Paid', 'Cancelled'].map(status => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setRequestsFilter(status)}
                  className={`menu-item-filter ${requestsFilter === status ? 'active' : ''}`}
                  style={{
                    padding: '6px 14px',
                    fontSize: '12px',
                    borderRadius: '20px',
                    background: requestsFilter === status ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    color: requestsFilter === status ? '#a78bfa' : '#9ca3af',
                    border: requestsFilter === status ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.05)',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>Service Type</th>
                    <th>Description</th>
                    <th>Booking Date</th>
                    <th>Assigned Technician</th>
                    <th>Status</th>
                    <th>Closing / Resolution</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const filteredRequests = requests.filter(req => {
                      if (requestsFilter === 'All') return true;
                      if (requestsFilter === 'Paid') return req.paymentStatus === 'Paid';
                      return req.status.toLowerCase() === requestsFilter.toLowerCase();
                    });
                    
                    return filteredRequests.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', color: '#9ca3af', padding: '30px' }}>No requests matching this status found.</td>
                      </tr>
                    ) : (
                      filteredRequests.map(req => (
                        <tr key={req._id}>
                          <td style={{ fontSize: '11px', color: '#9ca3af' }}>#{req._id.substring(req._id.length - 8)}</td>
                          <td style={{ fontWeight: '600', color: '#a78bfa' }}>{req.serviceType}</td>
                          <td>{req.description}</td>
                          <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                          <td>
                            {req.assignedAgentId ? (
                              <div>
                                <div>{req.assignedAgentId.name}</div>
                                <div style={{ fontSize: '11px', color: '#9ca3af' }}>{req.assignedAgentId.phone}</div>
                              </div>
                            ) : (
                              <span style={{ color: '#9ca3af', fontSize: '12px' }}>Awaiting allocation</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge badge-${req.status.toLowerCase().replace(' ', '-')}`}>
                              {req.status}
                            </span>
                          </td>
                          <td>
                            {req.status === 'Completed' || req.paymentStatus === 'Paid' ? (
                              <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                                <CheckCircle size={14} /> Resolved {req.completedAt ? new Date(req.completedAt).toLocaleDateString() : ''}
                              </span>
                            ) : (
                              <span style={{ color: '#9ca3af', fontSize: '12px' }}>In progress</span>
                            )}
                          </td>
                        </tr>
                      ))
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="section-card">
            <h2 className="section-title">Payment & Billing History</h2>
            <div className="table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Transaction / Request ID</th>
                    <th>Service Type</th>
                    <th>Completion Date</th>
                    <th>Amount Paid</th>
                    <th>Payment Method</th>
                    <th>Invoice Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: '#9ca3af', padding: '30px' }}>No payment transactions recorded.</td>
                    </tr>
                  ) : (
                    payments.map(pay => (
                      <tr key={pay._id}>
                        <td style={{ fontSize: '11px', color: '#9ca3af' }}>#{pay._id}</td>
                        <td style={{ fontWeight: '600' }}>{pay.serviceType}</td>
                        <td>{pay.paymentTimestamp ? new Date(pay.paymentTimestamp).toLocaleDateString() : new Date(pay.updatedAt).toLocaleDateString()}</td>
                        <td style={{ fontWeight: 'bold', color: '#10b981' }}>₹{pay.paymentAmount}</td>
                        <td>{pay.paymentMethod}</td>
                        <td>
                          <span className="badge badge-paid">Paid / Confirmed</span>
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
            <h2 className="section-title">Account Profile Settings</h2>
            {profileSuccess && <div className="success-banner" style={{ marginBottom: '15px', color: '#10b981', padding: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px' }}>{profileSuccess}</div>}
            {profileError && <div className="error-banner" style={{ marginBottom: '15px' }}>{profileError}</div>}

            <form onSubmit={handleProfileUpdate} className="dashboard-form">
              <div className="input-group">
                <label>Registered Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  required
                  style={{ background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px' }}
                />
              </div>

              <div className="input-group">
                <label>Contact Phone Number</label>
                <input
                  type="tel"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  style={{ background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px' }}
                />
              </div>

              <div className="input-group">
                <label>Default Billing / Installation Address</label>
                <input
                  type="text"
                  value={profileAddress}
                  onChange={(e) => setProfileAddress(e.target.value)}
                  style={{ background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px' }}
                />
              </div>

              <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                <input
                  type="checkbox"
                  id="recurring"
                  checked={profileIsRecurring}
                  onChange={(e) => setProfileIsRecurring(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="recurring" style={{ cursor: 'pointer', margin: 0 }}>Enroll in Annual Recurring Maintenance Plan</label>
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '15px' }}>
                Save Profile Changes
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerDashboard;
