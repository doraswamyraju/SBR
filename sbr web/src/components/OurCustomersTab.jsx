import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Search, Filter, RefreshCw, MapPin, Calendar, Tag, UserCheck, Trash2, X, AlertCircle, Layers } from 'lucide-react';

const OurCustomersTab = ({ isAdmin = false }) => {
  const [customers, setCustomers] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('All');
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
      if (selectedProduct && selectedProduct !== 'All') {
        queryParams.push(`product=${encodeURIComponent(selectedProduct)}`);
      }

      const queryString = queryParams.length ? `?${queryParams.join('&')}` : '';
      const res = await api.get(`api/customer-list${queryString}`);

      if (res.success) {
        setCustomers(res.data || []);
        if (res.products && Array.isArray(res.products)) {
          setAvailableProducts(res.products);
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
  }, [searchQuery, selectedProduct]);

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
    setSelectedProduct('All');
  };

  return (
    <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
      {/* Title & Refresh */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, color: '#0f172a', fontSize: '20px', fontWeight: '700' }}>
            <UserCheck size={24} color="#0284c7" /> Our Customers
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            Verified customer installations list across regions, products & models.
          </p>
        </div>

        <button 
          type="button"
          onClick={fetchCustomerList}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '8px 16px', 
            borderRadius: '8px', 
            fontSize: '13px',
            backgroundColor: '#ffffff',
            color: '#334155',
            border: '1px solid #cbd5e1',
            cursor: 'pointer',
            fontWeight: '600'
          }}
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
        padding: '16px', 
        borderRadius: '12px',
        border: '1px solid #e2e8f0'
      }}>
        {/* Search Field */}
        <div style={{ flex: '1 1 280px', position: 'relative', minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search by S.No, Name, Address, Product, Model, Date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 36px 10px 38px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13.5px',
              outline: 'none',
              backgroundColor: '#ffffff',
              color: '#0f172a'
            }}
          />
          {searchQuery && (
            <X 
              size={16} 
              onClick={() => setSearchQuery('')} 
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#64748b' }} 
            />
          )}
        </div>

        {/* Product Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="#0284c7" />
          <span style={{ fontSize: '13px', fontWeight: '500', color: '#334155' }}>Product Filter:</span>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13.5px',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              cursor: 'pointer',
              outline: 'none',
              minWidth: '180px'
            }}
          >
            <option value="All">All Products</option>
            {availableProducts.map((p, idx) => (
              <option key={idx} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {(searchQuery || selectedProduct !== 'All') && (
          <button 
            onClick={handleResetFilters}
            style={{
              padding: '9px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155',
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
          Showing <strong style={{ color: '#0284c7' }}>{customers.length}</strong> customer record{customers.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-banner" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Table Container */}
      <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', textTransform: 'uppercase', fontSize: '11.5px', letterSpacing: '0.6px', color: '#475569' }}>
              <th style={{ padding: '14px 16px', textAlign: 'left', width: '70px' }}>S.No.</th>
              <th style={{ padding: '14px 16px', textAlign: 'left' }}>Customer Name</th>
              <th style={{ padding: '14px 16px', textAlign: 'left' }}>Address</th>
              <th style={{ padding: '14px 16px', textAlign: 'left' }}>Product</th>
              <th style={{ padding: '14px 16px', textAlign: 'left' }}>Model (Optional)</th>
              <th style={{ padding: '14px 16px', textAlign: 'left' }}>Purchase Date</th>
              {isAdmin && <th style={{ padding: '14px 16px', textAlign: 'center', width: '80px' }}>Action</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 8px auto', display: 'block', color: '#0284c7' }} />
                  Loading customer records...
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                  <UserCheck size={36} style={{ color: '#94a3b8', marginBottom: '8px' }} />
                  <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '15px' }}>No customer records found</div>
                  <div style={{ fontSize: '13px', marginTop: '4px', color: '#64748b' }}>Try adjusting your search criteria or product filter.</div>
                </td>
              </tr>
            ) : (
              customers.map((item, index) => (
                <tr key={item._id || index} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s' }}>
                  {/* S.No */}
                  <td style={{ padding: '14px 16px', fontWeight: '600' }}>
                    <span style={{ 
                      display: 'inline-block', 
                      backgroundColor: '#eff6ff', 
                      color: '#0284c7', 
                      padding: '3px 10px', 
                      borderRadius: '6px', 
                      fontSize: '12px',
                      fontWeight: '700' 
                    }}>
                      {item.sNo || index + 1}
                    </span>
                  </td>

                  {/* Customer Name */}
                  <td style={{ padding: '14px 16px', fontWeight: '700', color: '#0f172a', fontSize: '14px' }}>
                    {item.name}
                  </td>

                  {/* Address */}
                  <td style={{ padding: '14px 16px', color: '#334155', fontSize: '13.5px' }}>
                    <span style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <MapPin size={15} color="#64748b" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{item.address || 'N/A'}</span>
                    </span>
                  </td>

                  {/* Product */}
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '5px', 
                      backgroundColor: '#e0f2fe', 
                      color: '#0369a1', 
                      padding: '4px 12px', 
                      borderRadius: '16px', 
                      fontSize: '12.5px', 
                      fontWeight: '600' 
                    }}>
                      <Tag size={13} /> {item.product || item.model || 'General Product'}
                    </span>
                  </td>

                  {/* Model (Optional) */}
                  <td style={{ padding: '14px 16px' }}>
                    {item.model && item.model.trim() !== '' ? (
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '5px', 
                        backgroundColor: '#ede9fe', 
                        color: '#6d28d9', 
                        padding: '4px 12px', 
                        borderRadius: '16px', 
                        fontSize: '12.5px', 
                        fontWeight: '600' 
                      }}>
                        <Layers size={13} /> {item.model}
                      </span>
                    ) : (
                      <span style={{ 
                        display: 'inline-block', 
                        padding: '2px 8px', 
                        borderRadius: '4px', 
                        backgroundColor: '#f1f5f9', 
                        color: '#94a3b8', 
                        fontSize: '12px',
                        border: '1px dashed #cbd5e1'
                      }}>
                        N/A
                      </span>
                    )}
                  </td>

                  {/* Purchase Date */}
                  <td style={{ padding: '14px 16px', color: '#334155', fontSize: '13px' }}>
                    {item.purchaseDate && item.purchaseDate.trim() !== '' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#047857', fontWeight: '600' }}>
                        <Calendar size={14} /> {item.purchaseDate}
                      </span>
                    ) : (
                      <span style={{ 
                        display: 'inline-block', 
                        padding: '2px 8px', 
                        borderRadius: '4px', 
                        backgroundColor: '#f1f5f9', 
                        color: '#94a3b8', 
                        fontSize: '12px',
                        border: '1px dashed #cbd5e1'
                      }}>
                        N/A
                      </span>
                    )}
                  </td>

                  {/* Admin Delete Action */}
                  {isAdmin && (
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleDeleteRecord(item._id)}
                        title="Delete Record"
                        className="btn-danger"
                        style={{
                          padding: '7px 9px',
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
