import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Search, Filter, RefreshCw, MapPin, Calendar, Tag, UserCheck, Trash2, X, AlertCircle } from 'lucide-react';

const OurCustomersTab = ({ isAdmin = false }) => {
  const [customers, setCustomers] = useState([]);
  const [availableModels, setAvailableModels] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCustomerList = async () => {
    setLoading(true);
    setError('');
    try {
      let queryParams = [];
      if (searchQuery.trim()) {
        queryParams.push(`search=${encodeURIComponent(searchQuery.trim())}`);
      }
      if (selectedModel && selectedModel !== 'All') {
        queryParams.push(`model=${encodeURIComponent(selectedModel)}`);
      }

      const queryString = queryParams.length ? `?${queryParams.join('&')}` : '';
      const res = await api.get(`api/customer-list${queryString}`);

      if (res.success) {
        setCustomers(res.data || []);
        if (res.models && Array.isArray(res.models)) {
          setAvailableModels(res.models);
        }
      } else {
        throw new Error(res.error || 'Failed to fetch customer list');
      }
    } catch (err) {
      setError(err.message || 'Failed to load customer list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCustomerList();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedModel]);

  const handleDeleteRecord = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer record?')) return;
    try {
      const res = await api.delete(`api/customer-list/${id}`);
      if (res.success) {
        fetchCustomerList();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete record');
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedModel('All');
  };

  return (
    <div className="section-card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <UserCheck size={22} color="#0284c7" /> Our Customers
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            Verified customer installations list across regions & product models.
          </p>
        </div>

        <button 
          className="btn-secondary" 
          onClick={fetchCustomerList}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', fontSize: '13px' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh List
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        flexWrap: 'wrap', 
        alignItems: 'center', 
        marginBottom: '20px', 
        backgroundColor: '#f8fafc', 
        padding: '14px', 
        borderRadius: '12px',
        border: '1px solid #e2e8f0'
      }}>
        {/* Search Field */}
        <div style={{ flex: '1 1 280px', position: 'relative', minWidth: '220px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search by S.No, Name, Address, Model, or Purchase Date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13.5px',
              outline: 'none',
              backgroundColor: '#ffffff'
            }}
          />
          {searchQuery && (
            <X 
              size={14} 
              onClick={() => setSearchQuery('')} 
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#94a3b8' }} 
            />
          )}
        </div>

        {/* Product Model Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="#64748b" />
          <span style={{ fontSize: '13px', fontWeight: '500', color: '#475569' }}>Product Model:</span>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            style={{
              padding: '9px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13.5px',
              backgroundColor: '#ffffff',
              cursor: 'pointer',
              outline: 'none',
              minWidth: '180px'
            }}
          >
            <option value="All">All Products & Models</option>
            {availableModels.map((m, idx) => (
              <option key={idx} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {(searchQuery || selectedModel !== 'All') && (
          <button 
            onClick={handleResetFilters}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#e2e8f0',
              color: '#475569',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Results Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
          Showing <strong>{customers.length}</strong> customer record{customers.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Table Container */}
      <div className="table-wrapper" style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
        <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textTransform: 'uppercase', fontSize: '11.5px', letterSpacing: '0.5px' }}>
              <th style={{ padding: '12px 14px', textAlign: 'left', width: '80px' }}>S.No.</th>
              <th style={{ padding: '12px 14px', textAlign: 'left' }}>Customer Name</th>
              <th style={{ padding: '12px 14px', textAlign: 'left' }}>Address</th>
              <th style={{ padding: '12px 14px', textAlign: 'left' }}>Product Model</th>
              <th style={{ padding: '12px 14px', textAlign: 'left' }}>Purchase Date</th>
              {isAdmin && <th style={{ padding: '12px 14px', textAlign: 'center', width: '90px' }}>Action</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                  <RefreshCw className="animate-spin" size={20} style={{ margin: '0 auto 8px auto', display: 'block' }} />
                  Loading customer records...
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  <UserCheck size={32} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
                  <div style={{ fontWeight: '500', color: '#334155' }}>No customer records found</div>
                  <div style={{ fontSize: '13px', marginTop: '4px' }}>Try adjusting your search criteria or model filter.</div>
                </td>
              </tr>
            ) : (
              customers.map((item, index) => (
                <tr key={item._id || index} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }}>
                  <td style={{ padding: '12px 14px', fontWeight: '600', color: '#475569' }}>
                    <span style={{ 
                      display: 'inline-block', 
                      backgroundColor: '#f1f5f9', 
                      padding: '2px 8px', 
                      borderRadius: '4px', 
                      fontSize: '12px' 
                    }}>
                      {item.sNo || index + 1}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: '600', color: '#0f172a' }}>
                    {item.name}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#334155', fontSize: '13px' }}>
                    <span style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <MapPin size={14} color="#64748b" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{item.address || 'N/A'}</span>
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '4px', 
                      backgroundColor: '#e0f2fe', 
                      color: '#0369a1', 
                      padding: '4px 10px', 
                      borderRadius: '16px', 
                      fontSize: '12.5px', 
                      fontWeight: '500' 
                    }}>
                      <Tag size={12} /> {item.model || 'Standard Product'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#475569', fontSize: '13px' }}>
                    {item.purchaseDate && item.purchaseDate.trim() !== '' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#15803d', fontWeight: '500' }}>
                        <Calendar size={13} /> {item.purchaseDate}
                      </span>
                    ) : (
                      <span style={{ 
                        display: 'inline-block', 
                        padding: '2px 8px', 
                        borderRadius: '4px', 
                        backgroundColor: '#f8fafc', 
                        color: '#94a3b8', 
                        fontSize: '12px',
                        border: '1px dashed #cbd5e1'
                      }}>
                        N/A
                      </span>
                    )}
                  </td>
                  {isAdmin && (
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleDeleteRecord(item._id)}
                        title="Delete Record"
                        style={{
                          backgroundColor: '#fee2e2',
                          color: '#dc2626',
                          border: 'none',
                          padding: '6px',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OurCustomersTab;
