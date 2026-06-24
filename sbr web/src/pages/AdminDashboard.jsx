import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import LeafletMap from '../components/LeafletMap';
import { 
  LayoutDashboard, 
  Wrench, 
  Users, 
  MapPin, 
  UserPlus, 
  Trash2, 
  LogOut, 
  CheckCircle, 
  Clock, 
  CreditCard, 
  Plus, 
  X, 
  RefreshCw, 
  Search,
  ChevronRight,
  TrendingUp,
  Sliders,
  DollarSign
} from 'lucide-react';
import './Dashboard.css';

const AdminDashboard = ({ handleNavigation }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modals state
  const [trackingRequest, setTrackingRequest] = useState(null);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  
  // New Agent Form State
  const [newAgent, setNewAgent] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    specialization: '',
    location: ''
  });
  const [agentFormLoading, setAgentFormLoading] = useState(false);
  const [agentFormError, setAgentFormError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const requestsRes = await api.get('api/requests');
      const usersRes = await api.get('api/users');
      
      if (requestsRes.success) setRequests(requestsRes.data);
      if (usersRes.success) setUsers(usersRes.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssignAgent = async (requestId, agentId) => {
    try {
      const res = await api.put(`api/requests/${requestId}/assign`, { agentId });
      if (res.success) {
        // Refresh requests lists
        const updatedRequests = requests.map(req => 
          req._id === requestId ? { ...req, assignedAgentId: users.find(u => u._id === agentId), status: 'Assigned' } : req
        );
        setRequests(updatedRequests);
        fetchData(); // refresh to get fully populated details
      }
    } catch (err) {
      alert(err.message || 'Failed to assign agent');
    }
  };

  const handleDeleteRequest = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service request?')) return;
    try {
      const res = await api.delete(`api/requests/${id}`);
      if (res.success) {
        setRequests(requests.filter(req => req._id !== id));
      }
    } catch (err) {
      alert(err.message || 'Failed to delete request');
    }
  };

  const handleCreateAgentSubmit = async (e) => {
    e.preventDefault();
    setAgentFormLoading(true);
    setAgentFormError('');
    try {
      // Register new user via auth register API, but using custom call to not override admin session
      const res = await fetch('http://localhost:5006/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newAgent, role: 'AGENT' })
      });
      const data = await res.json();
      
      if (data.success) {
        setIsAgentModalOpen(false);
        setNewAgent({ name: '', email: '', password: '', phone: '', specialization: '', location: '' });
        fetchData(); // reload users
        alert('Service agent account created successfully!');
      } else {
        throw new Error(data.error || 'Failed to create agent');
      }
    } catch (err) {
      setAgentFormError(err.message);
    } finally {
      setAgentFormLoading(false);
    }
  };

  // Calculations for Metrics
  const totalCollections = requests
    .filter(req => req.paymentStatus === 'Paid')
    .reduce((sum, req) => sum + (req.paymentAmount || 0), 0);
  
  const pendingRequestsCount = requests.filter(req => req.status === 'Pending').length;
  const activeRequestsCount = requests.filter(req => ['Assigned', 'Accepted', 'In Progress'].includes(req.status)).length;
  const completedRequestsCount = requests.filter(req => req.status === 'Completed').length;
  
  const agents = users.filter(u => u.role === 'AGENT');
  const customers = users.filter(u => u.role === 'CUSTOMER');
  const onlineAgentsCount = agents.filter(a => a.status === 'Online' || a.currentLat).length;

  const handleLogout = () => {
    logout();
    handleNavigation('home');
  };

  // Filters for requests
  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (req.customerId?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (req.assignedAgentId?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      req._id.includes(searchQuery);
    
    const matchesStatus = statusFilter === 'All' || req.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">SBR ADMIN</div>
        <div className="sidebar-menu">
          <button 
            className={`menu-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard size={18} /> Overview
          </button>
          <button 
            className={`menu-item ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            <Wrench size={18} /> Requests ({requests.length})
          </button>
          <button 
            className={`menu-item ${activeTab === 'agents' ? 'active' : ''}`}
            onClick={() => setActiveTab('agents')}
          >
            <Users size={18} /> Service Agents ({agents.length})
          </button>
          <button 
            className={`menu-item ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveTab('customers')}
          >
            <Users size={18} /> Customers ({customers.length})
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
            <h1>Admin Control Center</h1>
            <p>Welcome back, {user?.name || 'Administrator'}</p>
          </div>
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={fetchData}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Data
          </button>
        </header>

        {error && <div className="error-banner">{error}</div>}

        {/* Tab contents */}
        {activeTab === 'overview' && (
          <>
            {/* Metrics */}
            <div className="metrics-grid">
              <div className="metric-card">
                <span className="metric-title">Active Requests</span>
                <span className="metric-value">{activeRequestsCount}</span>
                <span style={{ fontSize: '12px', color: '#10b981' }}>{pendingRequestsCount} Pending</span>
              </div>
              <div className="metric-card">
                <span className="metric-title">Total Collections</span>
                <span className="metric-value">₹{totalCollections.toLocaleString('en-IN')}</span>
                <span style={{ fontSize: '12px', color: '#8b5cf6' }}>From completed jobs</span>
              </div>
              <div className="metric-card">
                <span className="metric-title">Completed Requests</span>
                <span className="metric-value">{completedRequestsCount}</span>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>Total jobs finished</span>
              </div>
              <div className="metric-card">
                <span className="metric-title">Agents Online</span>
                <span className="metric-value">{onlineAgentsCount} / {agents.length}</span>
                <span style={{ fontSize: '12px', color: '#6366f1' }}>With GPS active</span>
              </div>
            </div>

            {/* Quick Requests View */}
            <div className="section-card">
              <h2 className="section-title">Recent Requests & Assignments</h2>
              {loading ? (
                <div style={{ color: '#9ca3af' }}>Loading requests...</div>
              ) : (
                <div className="table-wrapper">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Request ID</th>
                        <th>Customer</th>
                        <th>Service Type</th>
                        <th>Created At</th>
                        <th>Status</th>
                        <th>Assign Agent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.slice(0, 5).map(req => (
                        <tr key={req._id}>
                          <td style={{ fontSize: '11px', color: '#9ca3af' }}>#{req._id.substring(req._id.length - 8)}</td>
                          <td>
                            <div>{req.customerId?.name || 'Unknown'}</div>
                            <div style={{ fontSize: '11px', color: '#9ca3af' }}>{req.customerId?.phone}</div>
                          </td>
                          <td>{req.serviceType}</td>
                          <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                          <td>
                            <span className={`badge badge-${req.status.toLowerCase().replace(' ', '-')}`}>
                              {req.status}
                            </span>
                          </td>
                          <td>
                            {req.status === 'Pending' ? (
                              <select 
                                className="select-assign"
                                onChange={(e) => handleAssignAgent(req._id, e.target.value)}
                                defaultValue=""
                              >
                                <option value="" disabled>Choose Agent...</option>
                                {agents.map(a => (
                                  <option key={a._id} value={a._id}>{a.name} ({a.specialization || 'General'})</option>
                                ))}
                              </select>
                            ) : (
                              <span style={{ fontSize: '13px', color: '#a78bfa', fontWeight: '500' }}>
                                {req.assignedAgentId?.name || 'Unassigned'}
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
          </>
        )}

        {activeTab === 'requests' && (
          <div className="section-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
              <h2 className="section-title" style={{ margin: 0 }}>Service Requests Directory</h2>
              
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search size={16} style={{ position: 'absolute', left: '10px', color: '#9ca3af' }} />
                  <input
                    type="text"
                    placeholder="Search type, client, agent..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '8px 12px 8px 32px',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none',
                      width: '220px'
                    }}
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  <option value="All" style={{ background: '#181823' }}>All Statuses</option>
                  <option value="Pending" style={{ background: '#181823' }}>Pending</option>
                  <option value="Assigned" style={{ background: '#181823' }}>Assigned</option>
                  <option value="Accepted" style={{ background: '#181823' }}>Accepted</option>
                  <option value="In Progress" style={{ background: '#181823' }}>In Progress</option>
                  <option value="Completed" style={{ background: '#181823' }}>Completed</option>
                  <option value="Cancelled" style={{ background: '#181823' }}>Cancelled</option>
                </select>
              </div>
            </div>

            <div className="table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>Customer Details</th>
                    <th>Request Details</th>
                    <th>Assigned Agent</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: '#9ca3af', padding: '30px' }}>No requests match the query.</td>
                    </tr>
                  ) : (
                    filteredRequests.map(req => (
                      <tr key={req._id}>
                        <td style={{ fontSize: '11px', color: '#9ca3af' }}>#{req._id.substring(req._id.length - 8)}</td>
                        <td>
                          <div style={{ fontWeight: '600' }}>{req.customerId?.name || 'Unknown'}</div>
                          <div style={{ fontSize: '11px', color: '#9ca3af' }}>{req.customerId?.phone}</div>
                          <div style={{ fontSize: '11px', color: '#9ca3af', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={req.customerAddress}>
                            {req.customerAddress}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: '600', color: '#a78bfa' }}>{req.serviceType}</div>
                          <div style={{ fontSize: '12px', color: '#d1d5db', marginTop: '2px' }}>{req.description}</div>
                        </td>
                        <td>
                          {req.assignedAgentId ? (
                            <div>
                              <div>{req.assignedAgentId.name}</div>
                              <div style={{ fontSize: '11px', color: '#9ca3af' }}>{req.assignedAgentId.phone}</div>
                              {['Assigned', 'Accepted', 'In Progress'].includes(req.status) && (
                                <button 
                                  className="btn-secondary" 
                                  style={{ padding: '2px 6px', fontSize: '10px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}
                                  onClick={() => setTrackingRequest(req)}
                                >
                                  <MapPin size={10} /> Track Live
                                </button>
                              )}
                            </div>
                          ) : (
                            <select 
                              className="select-assign"
                              onChange={(e) => handleAssignAgent(req._id, e.target.value)}
                              defaultValue=""
                            >
                              <option value="" disabled>Choose Agent...</option>
                              {agents.map(a => (
                                <option key={a._id} value={a._id}>{a.name}</option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td>
                          <span className={`badge badge-${req.status.toLowerCase().replace(' ', '-')}`}>
                            {req.status}
                          </span>
                        </td>
                        <td>
                          {req.paymentStatus === 'Paid' ? (
                            <div>
                              <span className="badge badge-paid">Paid</span>
                              <div style={{ fontSize: '12px', color: '#10b981', marginTop: '3px' }}>₹{req.paymentAmount}</div>
                              <div style={{ fontSize: '10px', color: '#9ca3af' }}>{req.paymentMethod}</div>
                            </div>
                          ) : (
                            <span className="badge badge-pending">Pending</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              className="btn-secondary btn-danger" 
                              style={{ padding: '6px' }}
                              onClick={() => handleDeleteRequest(req._id)}
                              title="Delete Request"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'agents' && (
          <div className="section-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 className="section-title" style={{ margin: 0 }}>Service Agent Personnel</h2>
              <button 
                className="btn-primary" 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
                onClick={() => setIsAgentModalOpen(true)}
              >
                <UserPlus size={16} /> Add Agent Account
              </button>
            </div>

            <div className="table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Specialization</th>
                    <th>Location Area</th>
                    <th>Status</th>
                    <th>Completed Jobs</th>
                    <th>Current GPS</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', color: '#9ca3af', padding: '30px' }}>No service agent accounts registered.</td>
                    </tr>
                  ) : (
                    agents.map(agent => (
                      <tr key={agent._id}>
                        <td style={{ fontWeight: '600' }}>{agent.name}</td>
                        <td>{agent.email}</td>
                        <td>{agent.phone || 'N/A'}</td>
                        <td>
                          <span style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#a78bfa', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                            {agent.specialization || 'General Technician'}
                          </span>
                        </td>
                        <td>{agent.location || 'N/A'}</td>
                        <td>
                          <span className={`badge ${agent.status === 'Online' ? 'badge-completed' : 'badge-cancelled'}`}>
                            {agent.status || 'Offline'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{agent.completedJobs || 0}</td>
                        <td>
                          {agent.currentLat ? (
                            <span style={{ fontSize: '11px', color: '#3b82f6', fontFamily: 'monospace' }}>
                              {agent.currentLat.toFixed(5)}, {agent.currentLng.toFixed(5)}
                            </span>
                          ) : (
                            <span style={{ color: '#9ca3af', fontSize: '12px' }}>No coordinates</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="section-card">
            <h2 className="section-title">Client Profiles Directory</h2>
            <div className="table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Recurring Service</th>
                    <th>Next Scheduled Date</th>
                    <th>Signed Up</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: '#9ca3af', padding: '30px' }}>No customer accounts registered.</td>
                    </tr>
                  ) : (
                    customers.map(cust => (
                      <tr key={cust._id}>
                        <td style={{ fontWeight: '600' }}>{cust.name}</td>
                        <td>{cust.email}</td>
                        <td>{cust.phone || 'N/A'}</td>
                        <td>{cust.address || 'No address specified'}</td>
                        <td>
                          <span className={`badge ${cust.isRecurring ? 'badge-completed' : 'badge-pending'}`}>
                            {cust.isRecurring ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td>
                          {cust.nextServiceDate ? new Date(cust.nextServiceDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td style={{ fontSize: '12px', color: '#9ca3af' }}>
                          {new Date(cust.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Map Live Location Modal */}
      {trackingRequest && (
        <div className="modal-backdrop" onClick={() => setTrackingRequest(null)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#ffffff' }}>
                Live Tracking: {trackingRequest.assignedAgentId?.name || 'Agent'}
              </h3>
              <button 
                type="button" 
                style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
                onClick={() => setTrackingRequest(null)}
              >
                <X size={20} />
              </button>
            </div>
            
            <LeafletMap 
              agentLocation={
                trackingRequest.assignedAgentId?.currentLat 
                  ? { lat: trackingRequest.assignedAgentId.currentLat, lng: trackingRequest.assignedAgentId.currentLng }
                  : null
              }
              locationPath={trackingRequest.locationPath || []}
              customerAddress={trackingRequest.customerAddress}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#d1d5db', marginTop: '15px', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
              <div>
                Service: <strong>{trackingRequest.serviceType}</strong>
              </div>
              <div>
                Status: <span className={`badge badge-${trackingRequest.status.toLowerCase().replace(' ', '-')}`}>{trackingRequest.status}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Agent Modal */}
      {isAgentModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAgentModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#ffffff' }}>Register Service Agent</h3>
              <button 
                type="button" 
                style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
                onClick={() => setIsAgentModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            {agentFormError && <div className="error-banner" style={{ marginBottom: '15px' }}>{agentFormError}</div>}

            <form onSubmit={handleCreateAgentSubmit} className="dashboard-form" style={{ gap: '12px' }}>
              <div className="input-group">
                <label>Full Name</label>
                <input
                  type="text"
                  required
                  value={newAgent.name}
                  onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                  placeholder="Agent Name"
                  style={{ background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px' }}
                />
              </div>

              <div className="input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  required
                  value={newAgent.email}
                  onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })}
                  placeholder="agent@sribalaji.com"
                  style={{ background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px' }}
                />
              </div>

              <div className="input-group">
                <label>Password</label>
                <input
                  type="password"
                  required
                  value={newAgent.password}
                  onChange={(e) => setNewAgent({ ...newAgent, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                  style={{ background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px' }}
                />
              </div>

              <div className="input-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  required
                  value={newAgent.phone}
                  onChange={(e) => setNewAgent({ ...newAgent, phone: e.target.value })}
                  placeholder="Phone number"
                  style={{ background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px' }}
                />
              </div>

              <div className="input-group">
                <label>Specialization</label>
                <input
                  type="text"
                  value={newAgent.specialization}
                  onChange={(e) => setNewAgent({ ...newAgent, specialization: e.target.value })}
                  placeholder="Solar Heaters, Water Softeners, etc."
                  style={{ background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px' }}
                />
              </div>

              <div className="input-group">
                <label>Assigned Area / Location</label>
                <input
                  type="text"
                  value={newAgent.location}
                  onChange={(e) => setNewAgent({ ...newAgent, location: e.target.value })}
                  placeholder="e.g. Bangalore North"
                  style={{ background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px' }}
                />
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                disabled={agentFormLoading}
                style={{ marginTop: '10px' }}
              >
                {agentFormLoading ? 'Creating Agent...' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
