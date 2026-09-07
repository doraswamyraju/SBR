import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  UploadCloud, 
  X, 
  Image as ImageIcon,
  Tag,
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';

const CATEGORIES = [
  'Solar Heating',
  'Water Treatment',
  'RO Purification',
  'Solar Power',
  'Heat Pumps',
  'Other Services'
];

const AdminProductsTab = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: 'Solar Heating',
    image: '',
    images: [],
    subtitle: '',
    tagline: '',
    description: '',
    features: [''],
    specifications: [{ key: '', value: '' }],
    faqs: [{ q: '', a: '' }],
    basePrice: '',
    mrp: '',
    commissionType: 'fixed',
    commissionValue: '',
    isActive: true
  });

  const [primaryImageUploading, setPrimaryImageUploading] = useState(false);
  const [multipleImagesUploading, setMultipleImagesUploading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('api/products?activeOnly=false');
      if (res.success) {
        setProducts(res.data);
      } else {
        setError(res.error || 'Failed to fetch products');
      }
    } catch (err) {
      setError('Error connecting to products API');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      slug: '',
      category: 'Solar Heating',
      image: '',
      images: [],
      subtitle: '',
      tagline: '',
      description: '',
      features: [''],
      specifications: [{ key: '', value: '' }],
      faqs: [{ q: '', a: '' }],
      basePrice: '',
      mrp: '',
      commissionType: 'fixed',
      commissionValue: '',
      isActive: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prod) => {
    setEditingProduct(prod);

    const specsArray = prod.specifications 
      ? Object.entries(prod.specifications).map(([key, value]) => ({ key, value }))
      : [{ key: '', value: '' }];

    setFormData({
      name: prod.name || '',
      slug: prod.slug || '',
      category: prod.category || 'Solar Heating',
      image: prod.image || '',
      images: prod.images || (prod.image ? [prod.image] : []),
      subtitle: prod.subtitle || '',
      tagline: prod.tagline || '',
      description: prod.description || '',
      features: prod.features && prod.features.length > 0 ? prod.features : [''],
      specifications: specsArray.length > 0 ? specsArray : [{ key: '', value: '' }],
      faqs: prod.faqs && prod.faqs.length > 0 ? prod.faqs : [{ q: '', a: '' }],
      basePrice: prod.basePrice !== undefined ? prod.basePrice : '',
      mrp: prod.mrp !== undefined ? prod.mrp : '',
      commissionType: prod.commissionType || 'fixed',
      commissionValue: prod.commissionValue !== undefined ? prod.commissionValue : '',
      isActive: prod.isActive !== undefined ? prod.isActive : true
    });
    setIsModalOpen(true);
  };

  // Image Upload Handlers
  const handlePrimaryImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPrimaryImageUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);

      const res = await api.upload('api/upload', uploadFormData);
      if (res.success) {
        setFormData(prev => {
          const newImages = [...prev.images];
          if (!newImages.includes(res.url)) {
            newImages.unshift(res.url);
          }
          return {
            ...prev,
            image: res.url,
            images: newImages
          };
        });
      } else {
        alert(res.error || 'Failed to upload primary image');
      }
    } catch (err) {
      alert('Error uploading file');
    } finally {
      setPrimaryImageUploading(false);
    }
  };

  const handleMultipleImagesUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    setMultipleImagesUploading(true);
    try {
      const uploadFormData = new FormData();
      files.forEach(file => {
        uploadFormData.append('images', file);
      });

      const res = await api.upload('api/upload/multiple', uploadFormData);
      if (res.success && res.data) {
        const newUrls = res.data.map(item => item.url);
        setFormData(prev => ({
          ...prev,
          image: prev.image || newUrls[0],
          images: Array.from(new Set([...prev.images, ...newUrls]))
        }));
      } else {
        alert(res.error || 'Failed to upload images');
      }
    } catch (err) {
      alert('Error uploading multiple files');
    } finally {
      setMultipleImagesUploading(false);
    }
  };

  const handleRemoveImage = (urlToRemove) => {
    setFormData(prev => {
      const updatedImages = prev.images.filter(url => url !== urlToRemove);
      let updatedPrimary = prev.image;
      if (prev.image === urlToRemove) {
        updatedPrimary = updatedImages.length > 0 ? updatedImages[0] : '';
      }
      return {
        ...prev,
        image: updatedPrimary,
        images: updatedImages
      };
    });
  };

  // Dynamic Array Handlers
  const handleFeatureChange = (index, value) => {
    const updated = [...formData.features];
    updated[index] = value;
    setFormData(prev => ({ ...prev, features: updated }));
  };

  const handleAddFeature = () => {
    setFormData(prev => ({ ...prev, features: [...prev.features, ''] }));
  };

  const handleRemoveFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleSpecChange = (index, field, value) => {
    const updated = [...formData.specifications];
    updated[index][field] = value;
    setFormData(prev => ({ ...prev, specifications: updated }));
  };

  const handleAddSpec = () => {
    setFormData(prev => ({
      ...prev,
      specifications: [...prev.specifications, { key: '', value: '' }]
    }));
  };

  const handleRemoveSpec = (index) => {
    setFormData(prev => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index)
    }));
  };

  const handleFaqChange = (index, field, value) => {
    const updated = [...formData.faqs];
    updated[index][field] = value;
    setFormData(prev => ({ ...prev, faqs: updated }));
  };

  const handleAddFaq = () => {
    setFormData(prev => ({
      ...prev,
      faqs: [...prev.faqs, { q: '', a: '' }]
    }));
  };

  const handleRemoveFaq = (index) => {
    setFormData(prev => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index)
    }));
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const specsMap = {};
    formData.specifications.forEach(item => {
      if (item.key.trim() && item.value.trim()) {
        specsMap[item.key.trim()] = item.value.trim();
      }
    });

    const payload = {
      ...formData,
      features: formData.features.filter(f => f.trim() !== ''),
      specifications: specsMap,
      faqs: formData.faqs.filter(faq => faq.q.trim() !== '' && faq.a.trim() !== ''),
      basePrice: Number(formData.basePrice) || 0,
      mrp: Number(formData.mrp) || 0,
      commissionValue: Number(formData.commissionValue) || 0
    };

    try {
      let res;
      if (editingProduct) {
        res = await api.put(`api/products/admin/${editingProduct._id}`, payload);
      } else {
        res = await api.post('api/products/admin', payload);
      }

      if (res.success) {
        setSuccessMsg(editingProduct ? 'Product updated successfully!' : 'New product created successfully!');
        setIsModalOpen(false);
        fetchProducts();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(res.error || 'Failed to save product');
      }
    } catch (err) {
      setError('Error saving product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const res = await api.delete(`api/products/admin/${id}`);
      if (res.success) {
        setSuccessMsg('Product deleted successfully');
        fetchProducts();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(res.error || 'Failed to delete product');
      }
    } catch (err) {
      setError('Error deleting product');
    }
  };

  const filteredProducts = products.filter(prod => {
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          prod.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'All' || prod.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 text-slate-900">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-sky-600" /> Products & Services Catalog
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage product specs, pricing, showcase gallery images, and referral commission rules.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchProducts}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-600 rounded-xl border border-slate-200 transition-all cursor-pointer shadow-sm"
            title="Refresh Products"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md transition-all duration-200 cursor-pointer text-sm"
          >
            <Plus className="w-4 h-4" /> Add New Product/Service
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-900"><X className="w-4 h-4"/></button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium">
            <XCircle className="w-5 h-5 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-600 hover:text-rose-900"><X className="w-4 h-4"/></button>
        </div>
      )}

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products or services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-600">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-slate-300 text-slate-800 text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Light Products Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="animate-spin w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full mx-auto mb-3"></div>
            Loading products catalog...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No products found matching your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-4 px-4">Product Info</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4">Base Price / MRP</th>
                  <th className="py-4 px-4">Referral Reward</th>
                  <th className="py-4 px-4">Images</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((prod) => (
                  <tr key={prod._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.image || 'https://placehold.co/100x100?text=No+Img'}
                          alt={prod.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-slate-50"
                        />
                        <div>
                          <div className="font-bold text-slate-900 line-clamp-1">{prod.name}</div>
                          <div className="text-xs text-slate-500 line-clamp-1">{prod.subtitle || prod.tagline}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-medium">
                      <span className="inline-block px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-200 text-xs font-semibold rounded-lg">
                        {prod.category}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900">₹{prod.basePrice?.toLocaleString()}</div>
                      {prod.mrp > prod.basePrice && (
                        <div className="text-xs text-slate-400 line-through">₹{prod.mrp?.toLocaleString()}</div>
                      )}
                    </td>
                    <td className="py-4 px-4 font-medium">
                      {prod.commissionType === 'percentage' ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-semibold">
                          <Sparkles className="w-3.5 h-3.5" /> {prod.commissionValue}% Commission
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-xs font-semibold">
                          <Tag className="w-3.5 h-3.5" /> ₹{prod.commissionValue} Flat
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-xs font-medium text-slate-600">
                      <span className="px-2 py-1 bg-slate-100 rounded-md border border-slate-200">
                        {prod.images?.length || 1} pic(s)
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {prod.isActive ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Hidden
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(prod)}
                          className="p-2 text-slate-600 hover:text-sky-600 bg-slate-50 hover:bg-sky-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                          title="Edit Product"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(prod._id, prod.name)}
                          className="p-2 text-rose-500 hover:text-rose-700 bg-slate-50 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white text-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-sky-600" />
                {editingProduct ? 'Edit Product/Service' : 'Add New Product/Service'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              {/* SECTION 1: BASIC INFO */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sky-600 text-xs uppercase tracking-wider border-b border-slate-200 pb-2">
                  1. Basic Information
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Product Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SPC Solar Water Heater (200L)"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Subtitle</label>
                    <input
                      type="text"
                      placeholder="e.g. Maintenance-Free Electrolysis Treatment"
                      value={formData.subtitle}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tagline</label>
                    <input
                      type="text"
                      placeholder="e.g. Eco-friendly, chemical-free scale protection"
                      value={formData.tagline}
                      onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Description</label>
                  <textarea
                    rows={3}
                    placeholder="Provide full description of product features and benefits..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                  />
                </div>
              </div>

              {/* SECTION 2: MULTIPLE IMAGES UPLOAD */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sky-600 text-xs uppercase tracking-wider border-b border-slate-200 pb-2">
                  2. Product Images & Gallery (Multiple Pics)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Primary Image Upload */}
                  <div className="p-4 border border-dashed border-slate-300 rounded-xl bg-slate-50">
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Upload Primary Thumbnail</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePrimaryImageUpload}
                        className="hidden"
                        id="primary-image-input"
                      />
                      <label
                        htmlFor="primary-image-input"
                        className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
                      >
                        <UploadCloud className="w-4 h-4 text-sky-600" />
                        {primaryImageUploading ? 'Uploading...' : 'Choose Primary Image'}
                      </label>
                    </div>
                  </div>

                  {/* Multiple Images Upload */}
                  <div className="p-4 border border-dashed border-sky-300 rounded-xl bg-sky-50/50">
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Upload Showcase Gallery Pictures (Multiple)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleMultipleImagesUpload}
                        className="hidden"
                        id="multiple-images-input"
                      />
                      <label
                        htmlFor="multiple-images-input"
                        className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-semibold hover:bg-sky-500 shadow-sm"
                      >
                        <ImageIcon className="w-4 h-4" />
                        {multipleImagesUploading ? 'Uploading Pics...' : '+ Add Multiple Showcase Pics'}
                      </label>
                    </div>
                  </div>
                </div>

                {/* Direct Image URL fallback */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Or Primary Image URL</label>
                  <input
                    type="text"
                    placeholder="https://i.postimg.cc/..."
                    value={formData.image}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      image: e.target.value,
                      images: Array.from(new Set([e.target.value, ...formData.images])).filter(Boolean)
                    })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                  />
                </div>

                {/* Images Preview Grid */}
                {formData.images.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Current Uploaded Pictures ({formData.images.length})</label>
                    <div className="flex flex-wrap gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      {formData.images.map((imgUrl, idx) => (
                        <div key={idx} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-slate-200 bg-white">
                          <img src={imgUrl} alt={`Product ${idx}`} className="w-full h-full object-cover" />
                          {imgUrl === formData.image && (
                            <span className="absolute bottom-0 inset-x-0 bg-sky-600 text-white text-[9px] font-bold text-center py-0.5">
                              PRIMARY
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(imgUrl)}
                            className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            title="Remove picture"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 3: PRICING & REFERRAL COMMISSION */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sky-600 text-xs uppercase tracking-wider border-b border-slate-200 pb-2">
                  3. Pricing & Referral Commission Rules
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Base Price (₹) *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 26500"
                      value={formData.basePrice}
                      onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">MRP Price (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 30000"
                      value={formData.mrp}
                      onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Commission Type</label>
                    <select
                      value={formData.commissionType}
                      onChange={(e) => setFormData({ ...formData, commissionType: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                    >
                      <option value="fixed">Fixed Amount (₹)</option>
                      <option value="percentage">Percentage (%)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {formData.commissionType === 'percentage' ? 'Commission %' : 'Commission Amount (₹)'} *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder={formData.commissionType === 'percentage' ? 'e.g. 5' : 'e.g. 1000'}
                      value={formData.commissionValue}
                      onChange={(e) => setFormData({ ...formData, commissionValue: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                  />
                  <label htmlFor="isActiveCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Active & Visible in Product Catalog / Website
                  </label>
                </div>
              </div>

              {/* SECTION 4: DYNAMIC FEATURES */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="font-semibold text-sky-600 text-xs uppercase tracking-wider">
                    4. Key Features Bullet Points
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Feature Bullet
                  </button>
                </div>

                {formData.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Feature #${idx + 1} (e.g. Zero Water Wastage: Eco-friendly system)`}
                      value={feat}
                      onChange={(e) => handleFeatureChange(idx, e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400"
                    />
                    {formData.features.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* SECTION 5: TECHNICAL SPECIFICATIONS */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="font-semibold text-sky-600 text-xs uppercase tracking-wider">
                    5. Technical Specifications Table
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddSpec}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Specification Pair
                  </button>
                </div>

                {formData.specifications.map((spec, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Spec Name (e.g. Technology / Capacity)"
                      value={spec.key}
                      onChange={(e) => handleSpecChange(idx, 'key', e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Spec Detail (e.g. 100 LPD to 500 LPD)"
                        value={spec.value}
                        onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400"
                      />
                      {formData.specifications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSpec(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* SECTION 6: FAQS */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="font-semibold text-sky-600 text-xs uppercase tracking-wider">
                    6. Frequently Asked Questions (FAQs)
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddFaq}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add FAQ Pair
                  </button>
                </div>

                {formData.faqs.map((faq, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">FAQ #{idx + 1}</span>
                      {formData.faqs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFaq(idx)}
                          className="text-rose-500 hover:text-rose-700 text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Question..."
                      value={faq.q}
                      onChange={(e) => handleFaqChange(idx, 'q', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 font-medium"
                    />
                    <textarea
                      rows={2}
                      placeholder="Answer..."
                      value={faq.a}
                      onChange={(e) => handleFaqChange(idx, 'a', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400"
                    />
                  </div>
                ))}
              </div>

              {/* Form Footer Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white py-3 z-10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-sky-600 text-white rounded-xl text-sm font-semibold hover:bg-sky-500 shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Saving Product...' : editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductsTab;
