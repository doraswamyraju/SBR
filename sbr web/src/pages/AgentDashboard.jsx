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
  Plus,
  Trash2,
  Phone,
  Tag,
  ShieldCheck,
  Receipt
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
  
  // Assessment & Acceptance State
  const [assessingJob, setAssessingJob] = useState(null);
  const [assessmentMode, setAssessmentMode] = useState('NO_PARTS'); // 'NO_PARTS' | 'WITH_PARTS'
  const [assessmentParts, setAssessmentParts] = useState([
    { posProductId: null, productId: null, name: '', sku: '', quantity: 1, unitPrice: 0, availableStock: 0 }
  ]);
  const [assessmentRemarks, setAssessmentRemarks] = useState('');
  const [submittingAssessment, setSubmittingAssessment] = useState(false);

  // Completion & Payment Split form state
  const [serviceCharge, setServiceCharge] = useState('250');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [discountRemarks, setDiscountRemarks] = useState('');
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

  // Manual multi-item indent modal state
  const [showManualIndentModal, setShowManualIndentModal] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [manualIndentItems, setManualIndentItems] = useState([
    { posProductId: null, productId: null, productName: '', sku: '', requestedQuantity: 1, currentStock: null }
  ]);
  const [manualIndentRemarks, setManualIndentRemarks] = useState('');
  const [submittingManualIndent, setSubmittingManualIndent] = useState(false);

  const fetchCatalogProducts = async () => {
    setLoadingCatalog(true);
    try {
      const res = await api.get('api/products');
      if (res.success && Array.isArray(res.data)) {
        setCatalogProducts(res.data);
      }
    } catch (err) {
      console.error('Failed to load catalog products:', err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  const openManualIndentModal = () => {
    setShowManualIndentModal(true);
    setManualIndentItems([
      { posProductId: null, productId: null, productName: '', sku: '', requestedQuantity: 1, currentStock: null }
    ]);
    setManualIndentRemarks('');
    if (catalogProducts.length === 0) {
      fetchCatalogProducts();
    }
  };

  const addManualIndentRow = () => {
    setManualIndentItems(prev => [
      ...prev,
      { posProductId: null, productId: null, productName: '', sku: '', requestedQuantity: 1, currentStock: null }
    ]);
  };

  const removeManualIndentRow = (index) => {
    setManualIndentItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSelectProductForRow = (index, productObjOrName) => {
    setManualIndentItems(prev => {
      const updated = [...prev];
      if (typeof productObjOrName === 'object' && productObjOrName !== null) {
        updated[index] = {
          ...updated[index],
          posProductId: productObjOrName.posProductId || productObjOrName.id || null,
          productId: productObjOrName._id || null,
          productName: productObjOrName.name || '',
          sku: productObjOrName.sku || '',
          currentStock: productObjOrName.stockLevel ?? productObjOrName.stock_level ?? 0
        };
      } else {
        updated[index] = {
          ...updated[index],
          productName: productObjOrName,
          posProductId: null,
          productId: null,
          currentStock: null
        };
      }
      return updated;
    });
  };

  const updateManualIndentQty = (index, qty) => {
    setManualIndentItems(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        requestedQuantity: Math.max(1, parseInt(qty) || 1)
      };
      return updated;
    });
  };

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
      fetchCatalogProducts();
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
    const validItems = manualIndentItems.filter(it => it.productName && it.productName.trim() && it.requestedQuantity > 0);
    if (validItems.length === 0) {
      alert('Please select or enter at least one spare part item.');
      return;
    }
    setSubmittingManualIndent(true);
    try {
      const res = await api.post('api/indents/create', {
        items: validItems.map(it => ({
          posProductId: it.posProductId,
          productId: it.productId,
          productName: it.productName.trim(),
          sku: it.sku || '',
          requestedQuantity: Number(it.requestedQuantity)
        })),
        agentRemarks: manualIndentRemarks
      });
      if (res.success) {
        alert(`Indent request for ${validItems.length} part(s) submitted to Store In-Charge!`);
        setShowManualIndentModal(false);
        setManualIndentItems([
          { posProductId: null, productId: null, productName: '', sku: '', requestedQuantity: 1, currentStock: null }
        ]);
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
    fetchVanStockAndIndents();
    fetchCatalogProducts();
  }, []);

  // Cleanup tracking timer on unmount
  useEffect(() => {
    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, []);

  // --- Assessment & Acceptance Logic ---
  const openAssessmentModal = (job) => {
    setAssessingJob(job);
    setAssessmentMode('NO_PARTS');
    setAssessmentParts([
      { posProductId: null, productId: null, name: '', sku: '', quantity: 1, unitPrice: 0, availableStock: 0 }
    ]);
    setAssessmentRemarks('');
    fetchVanStockAndIndents();
    fetchCatalogProducts();
  };

  const addAssessmentPartRow = () => {
    setAssessmentParts(prev => [
      ...prev,
      { posProductId: null, productId: null, name: '', sku: '', quantity: 1, unitPrice: 0, availableStock: 0 }
    ]);
  };

  const removeAssessmentPartRow = (index) => {
    setAssessmentParts(prev => prev.filter((_, i) => i !== index));
  };

  const handleSelectAssessmentPart = (index, productObjOrName) => {
    setAssessmentParts(prev => {
      const updated = [...prev];
      if (typeof productObjOrName === 'object' && productObjOrName !== null) {
        // Look up in agent's live vanInventory
        const vanMatch = vanInventory.find(v => 
          (productObjOrName.posProductId && Number(v.posProductId) === Number(productObjOrName.posProductId)) ||
          (v.productName && v.productName.trim().toLowerCase() === productObjOrName.name?.trim().toLowerCase())
        );
        const availQty = vanMatch ? Number(vanMatch.quantity || 0) : 0;
        const price = Number(productObjOrName.price || productObjOrName.unitPrice || 0);

        updated[index] = {
          ...updated[index],
          posProductId: productObjOrName.posProductId || productObjOrName.id || null,
          productId: productObjOrName._id || null,
          name: productObjOrName.name || '',
          sku: productObjOrName.sku || '',
          unitPrice: price,
          availableStock: availQty
        };
      } else {
        updated[index] = {
          ...updated[index],
          name: productObjOrName,
          posProductId: null,
          productId: null,
          unitPrice: 0,
          availableStock: 0
        };
      }
      return updated;
    });
  };

  const updateAssessmentPartQty = (index, qty) => {
    setAssessmentParts(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        quantity: Math.max(1, parseInt(qty) || 1)
      };
      return updated;
    });
  };

  const handleAcceptJobWithAssessment = async (e) => {
    if (e) e.preventDefault();
    if (!assessingJob) return;

    let payloadComponents = [];
    if (assessmentMode === 'WITH_PARTS') {
      const valid = assessmentParts.filter(p => p.name && p.name.trim() && p.quantity > 0);
      if (valid.length === 0) {
        alert('Please select at least one spare part or choose "Service Only" if no parts are needed.');
        return;
      }
      // Check if any item exceeds available van stock
      const outOfStock = valid.filter(p => p.quantity > p.availableStock);
      if (outOfStock.length > 0) {
        const itemNames = outOfStock.map(o => `• ${o.name} (Need: ${o.quantity}, In Van: ${o.availableStock})`).join('\n');
        const proceedWithIndent = window.confirm(
          `You do not have enough stock in your Van Kit for:\n${itemNames}\n\nWould you like to raise an Indent Requisition to Store In-Charge now?`
        );
        if (proceedWithIndent) {
          setAssessingJob(null);
          openManualIndentModal();
        }
        return;
      }
      payloadComponents = valid;
    }

    setSubmittingAssessment(true);
    try {
      const res = await api.put(`api/requests/${assessingJob._id}/status`, {
        status: 'Accepted',
        requiredComponents: payloadComponents
      });
      if (res.success) {
        setRequests(requests.map(req => 
          req._id === assessingJob._id 
            ? { ...req, status: 'Accepted', acceptedAt: new Date(), requiredComponents: res.data?.requiredComponents || payloadComponents, inventoryTotal: res.data?.inventoryTotal || 0 } 
            : req
        ));
        alert(
          assessmentMode === 'WITH_PARTS'
            ? `Job offer accepted! ${payloadComponents.length} spare part(s) allocated for this service.`
            : 'Job offer accepted as Service / Inspection only!'
        );
        setAssessingJob(null);
        fetchJobs();
      }
    } catch (err) {
      if (err.stockShortage && err.missingComponents) {
        setShortageModalData({
          requestId: assessingJob._id,
          missingComponents: err.missingComponents,
          message: err.message
        });
        setAssessingJob(null);
      } else {
        alert(err.message || 'Failed to accept job offer');
      }
    } finally {
      setSubmittingAssessment(false);
    }
  };

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

  // --- Completion & Payment Breakdown Logic ---
  const [completionParts, setCompletionParts] = useState([]);

  const openCompleteModal = (job) => {
    setCompletingRequestId(job._id);
    const initialParts = (job.requiredComponents || []).map(c => ({
      posProductId: c.posProductId || null,
      productId: c.productId || null,
      name: c.name || c.productName,
      sku: c.sku || '',
      quantity: Number(c.quantity) || 1,
      unitPrice: Number(c.unitPrice || c.price) || 0
    }));
    setCompletionParts(initialParts);
    const partsTotal = initialParts.reduce(
      (sum, c) => sum + (c.quantity * c.unitPrice),
      0
    );
    const defService = 250;
    const defDiscount = 0;
    setServiceCharge(String(defService));
    setDiscountAmount(String(defDiscount));
    setDiscountRemarks('');
    setPaymentAmount(String(Math.max(0, partsTotal + defService - defDiscount)));
    setPaymentMethod('Cash');
    setCompletionError('');
    fetchVanStockAndIndents();
    fetchCatalogProducts();
  };

  const addCompletionPartRow = () => {
    setCompletionParts(prev => [
      ...prev,
      { posProductId: null, productId: null, name: '', sku: '', quantity: 1, unitPrice: 0 }
    ]);
  };

  const removeCompletionPartRow = (index) => {
    setCompletionParts(prev => {
      const updated = prev.filter((_, i) => i !== index);
      recalcPaymentTotal(updated, serviceCharge, discountAmount);
      return updated;
    });
  };

  const handleSelectCompletionPart = (index, productObjOrName) => {
    setCompletionParts(prev => {
      const updated = [...prev];
      if (typeof productObjOrName === 'object' && productObjOrName !== null) {
        updated[index] = {
          ...updated[index],
          posProductId: productObjOrName.posProductId || productObjOrName.id || null,
          productId: productObjOrName._id || null,
          name: productObjOrName.name || '',
          sku: productObjOrName.sku || '',
          unitPrice: Number(productObjOrName.price || productObjOrName.unitPrice || 0)
        };
      } else {
        updated[index] = {
          ...updated[index],
          name: productObjOrName,
          posProductId: null,
          productId: null,
          unitPrice: 0
        };
      }
      recalcPaymentTotal(updated, serviceCharge, discountAmount);
      return updated;
    });
  };

  const updateCompletionPartQty = (index, qty) => {
    setCompletionParts(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        quantity: Math.max(1, parseInt(qty) || 1)
      };
      recalcPaymentTotal(updated, serviceCharge, discountAmount);
      return updated;
    });
  };

  const recalcPaymentTotal = (parts, sc, disc) => {
    const pTotal = parts.reduce(
      (sum, c) => sum + ((Number(c.quantity) || 1) * (Number(c.unitPrice) || 0)),
      0
    );
    const scNum = Math.max(0, Number(sc) || 0);
    const discNum = Math.max(0, Number(disc) || 0);
    setPaymentAmount(String(Math.max(0, (pTotal + scNum) - discNum)));
  };

  const handlePricingChange = (newServiceCharge, newDiscount) => {
    recalcPaymentTotal(completionParts, newServiceCharge, newDiscount);
  };

  const handleCompleteJobSubmit = async (e) => {
    e.preventDefault();
    setCompletionLoading(true);
    setCompletionError('');

    try {
      const validParts = completionParts.filter(p => p.name && p.name.trim() && p.quantity > 0);
      const partsTotal = validParts.reduce(
        (sum, c) => sum + ((Number(c.quantity) || 1) * (Number(c.unitPrice) || 0)),
        0
      );
      const parsedService = parseFloat(serviceCharge) || 0;
      const parsedDiscount = parseFloat(discountAmount) || 0;
      const parsedAmount = Math.max(0, (partsTotal + parsedService) - parsedDiscount);

      // 1. Post payment details with full breakdown & updated parts
      const paymentRes = await api.put(`api/requests/${completingRequestId}/payment`, {
        amount: parsedAmount,
        method: paymentMethod,
        inventoryTotal: partsTotal,
        serviceCharge: parsedService,
        discount: parsedDiscount,
        discountRemarks: discountRemarks,
        requiredComponents: validParts
      });

      // 2. Update status to completed & deduct inventory
      if (paymentRes.success) {
        const statusRes = await api.put(`api/requests/${completingRequestId}/status`, {
          status: 'Completed',
          requiredComponents: validParts
        });

        if (statusRes.success) {
          // Increment completed jobs count local display
          const updatedUser = { ...user, completedJobs: (user.completedJobs || 0) + 1 };
          setUser(updatedUser);
          localStorage.setItem('auth_user', JSON.stringify(updatedUser));

          setCompletingRequestId(null);
          setPaymentAmount('');
          setPaymentMethod('Cash');
          await fetchJobs();
          await fetchVanStockAndIndents();
          alert(`Job marked as Completed!\nTotal Collected: ₹${parsedAmount} (Parts: ₹${partsTotal} + Service: ₹${parsedService} - Discount: ₹${parsedDiscount})`);
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
        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '15px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Compass className={isTrackingActive ? 'animate-spin' : ''} size={16} style={{ color: isTrackingActive ? '#059669' : '#64748b' }} />
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>Mock GPS Broadcast</span>
          </div>
          <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 10px 0' }}>
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
        <div style={{ padding: '10px 15px', fontSize: '11px', color: '#64748b', borderTop: '1px solid #e2e8f0', marginTop: '20px' }}>
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
                <div style={{ color: '#64748b' }}>Loading jobs...</div>
              ) : assignedJobs.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: '14px' }}>No new service assignments. Check back later.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {assignedJobs.map(job => (
                    <div 
                      key={job._id}
                      style={{ 
                        background: '#ffffff', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '12px', 
                        padding: '20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '15px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div>
                        <span className="badge badge-assigned" style={{ marginBottom: '8px' }}>Assigned</span>
                        <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#0f172a' }}>{job.serviceType}</h3>
                        <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#475569' }}>{job.description}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b' }}>
                          <MapPin size={14} /> Address: {job.customerAddress}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                          className="btn-primary" 
                          style={{ padding: '8px 18px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
                          onClick={() => openAssessmentModal(job)}
                        >
                          <Wrench size={15} /> Assess & Accept
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
                <div style={{ color: '#64748b', fontSize: '14px' }}>No active service tasks. Accept an assignment above to start.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {activeJobs.map(job => (
                    <div 
                      key={job._id}
                      style={{ 
                        background: '#ffffff', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '16px', 
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '15px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <span className={`badge badge-${job.status.toLowerCase().replace(' ', '-')}`}>
                            {job.status}
                          </span>
                          <h3 style={{ margin: '8px 0 6px 0', fontSize: '18px', color: '#0f172a' }}>{job.serviceType}</h3>
                          <p style={{ margin: '0 0 6px 0', color: '#475569', fontSize: '14px' }}>{job.description}</p>
                          
                          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '10px' }}>
                            <div>Client Name: <strong style={{ color: '#1e293b' }}>{job.customerId?.name}</strong></div>
                            <div>Phone: <strong style={{ color: '#1e293b' }}>{job.customerId?.phone}</strong></div>
                            <div>Location: <strong style={{ color: '#1e293b' }}>{job.customerAddress}</strong></div>
                          </div>

                          {/* Allocated Spare Parts summary */}
                          {job.requiredComponents && job.requiredComponents.length > 0 ? (
                            <div style={{ marginTop: '12px', background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                                <Package size={13} style={{ color: '#d97706' }} /> Allocated Van Parts ({job.requiredComponents.length}):
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {job.requiredComponents.map((c, i) => (
                                  <span key={i} style={{ fontSize: '11px', background: '#ffffff', border: '1px solid #cbd5e1', padding: '3px 8px', borderRadius: '6px', color: '#0f172a', fontWeight: '600' }}>
                                    {c.name} × {c.quantity} {c.unitPrice > 0 ? `(₹${c.unitPrice * c.quantity})` : ''}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div style={{ marginTop: '10px', fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                              🔧 Service / Inspection Only (No Spare Parts Allocated)
                            </div>
                          )}
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
                              onClick={() => openCompleteModal(job)}
                            >
                              Mark Completed
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Image Upload Row */}
                      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '15px', marginTop: '10px' }}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#64748b', textTransform: 'uppercase' }}>Service Quality Documentation</h4>
                        
                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                          {/* Before Photo Upload */}
                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <span style={{ fontSize: '12px', display: 'block', marginBottom: '8px', color: '#475569' }}>Before Image:</span>
                            {job.beforeImageUrl ? (
                              <img src={job.beforeImageUrl} alt="Before Service" className="photo-preview" />
                            ) : (
                              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', border: '1px dashed #cbd5e1', padding: '20px', borderRadius: '8px', cursor: 'pointer' }}>
                                <Upload size={20} style={{ color: '#64748b', marginBottom: '6px' }} />
                                <span style={{ fontSize: '12px', color: '#64748b' }}>
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
                            <span style={{ fontSize: '12px', display: 'block', marginBottom: '8px', color: '#475569' }}>After Image:</span>
                            {job.afterImageUrl ? (
                              <img src={job.afterImageUrl} alt="After Service" className="photo-preview" />
                            ) : (
                              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', border: '1px dashed #cbd5e1', padding: '20px', borderRadius: '8px', cursor: 'pointer' }}>
                                <Upload size={20} style={{ color: '#64748b', marginBottom: '6px' }} />
                                <span style={{ fontSize: '12px', color: '#64748b' }}>
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
                        <td style={{ fontSize: '11px', color: '#64748b' }}>#{job._id.substring(job._id.length - 8)}</td>
                        <td>
                          <div style={{ fontWeight: '600', color: '#1e293b' }}>{job.customerId?.name || 'Customer'}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{job.customerId?.phone}</div>
                        </td>
                        <td style={{ fontWeight: '600', color: '#4f46e5' }}>{job.serviceType}</td>
                        <td>{job.completedAt ? new Date(job.completedAt).toLocaleDateString() : new Date(job.updatedAt).toLocaleDateString()}</td>
                        <td style={{ fontWeight: 'bold', color: '#059669' }}>₹{job.paymentAmount || 0}</td>
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
            
            <div className="profile-details-card" style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4338ca', fontSize: '24px', fontWeight: 'bold' }}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{user?.name}</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>{user?.email}</p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '14px' }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '12px', marginBottom: '4px' }}>Phone Number</span>
                  <strong style={{ color: '#0f172a' }}>{user?.phone || 'Not Provided'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '12px', marginBottom: '4px' }}>Specialization</span>
                  <strong style={{ color: '#0f172a' }}>{user?.specialization || 'General Technician'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '12px', marginBottom: '4px' }}>Location Scope</span>
                  <strong style={{ color: '#0f172a' }}>{user?.location || 'Tirupati Region'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '12px', marginBottom: '4px' }}>Total Completed Jobs</span>
                  <strong style={{ color: '#0f172a' }}>{user?.completedJobs || 0} jobs</strong>
                </div>
              </div>
            </div>

            <div className="availability-card" style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>Work Availability Status</h3>
              <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: '#64748b' }}>
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
                    background: user?.status === 'Online' ? '#d1fae5' : '#fee2e2',
                    color: user?.status === 'Online' ? '#047857' : '#b91c1c',
                    border: user?.status === 'Online' ? '1px solid #a7f3d0' : '1px solid #fecaca',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Status: {user?.status || 'Offline'}
                </button>
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  {user?.status === 'Online' ? '🟢 You are ready to accept new service requests.' : '🔴 You will not receive any new requests.'}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
              <h3 style={{ color: '#ef4444', fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>Danger Zone</h3>
              <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '15px' }}>
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
                className="btn-danger"
                style={{
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
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#0f172a' }}>
                  End-of-Day (EOD) Cash Handover
                </h2>
                <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
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
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Calculating daily cash summary...</div>
            ) : (
              <div>
                {/* Daily Summary Card */}
                <div style={{
                  background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)',
                  border: '1px solid #c7d2fe',
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
                    <span style={{ fontSize: '12px', color: '#4338ca', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Today's Cash Collection ({dailyCashSummary?.date || 'Today'})
                    </span>
                    <h3 style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', margin: '5px 0' }}>
                      ₹{dailyCashSummary?.totalCash || 0}
                    </h3>
                    <p style={{ fontSize: '12px', color: '#475569', margin: 0 }}>
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
                            ? '#d1fae5'
                            : dailyCashSummary.handoverStatus === 'DISCREPANCY'
                            ? '#fee2e2'
                            : '#ede9fe',
                          color: dailyCashSummary.handoverStatus === 'ACKNOWLEDGED'
                            ? '#047857'
                            : dailyCashSummary.handoverStatus === 'DISCREPANCY'
                            ? '#b91c1c'
                            : '#6d28d9',
                          border: '1px solid currentColor'
                        }}>
                          {dailyCashSummary.handoverStatus === 'ACKNOWLEDGED' ? '✓ Reconciled & Acknowledged' : dailyCashSummary.handoverStatus === 'DISCREPANCY' ? '⚠ Discrepancy Flagged' : '⏳ Submitted (Pending In-Charge)'}
                        </span>
                        {dailyCashSummary.existingHandover?.acknowledgedAmount !== null && dailyCashSummary.existingHandover?.acknowledgedAmount !== undefined && (
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                            Acknowledged: <strong>₹{dailyCashSummary.existingHandover.acknowledgedAmount}</strong>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="badge badge-pending">
                        Pending Submission
                      </span>
                    )}
                  </div>
                </div>

                {handoverSuccessMsg && (
                  <div className="success-banner" style={{ marginBottom: '20px' }}>
                    {handoverSuccessMsg}
                  </div>
                )}

                {handoverErrorMsg && (
                  <div className="error-banner" style={{ marginBottom: '20px' }}>
                    {handoverErrorMsg}
                  </div>
                )}

                {/* Submission Form (Only if not already acknowledged) */}
                {(!dailyCashSummary?.alreadySubmitted || dailyCashSummary?.handoverStatus === 'SUBMITTED') && (
                  <div className="section-card" style={{ marginBottom: '25px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 15px 0' }}>
                      {dailyCashSummary?.alreadySubmitted ? 'Update Handover Notes' : 'Submit Handover to Store In-Charge'}
                    </h4>

                    {dailyCashSummary?.completedRequests && dailyCashSummary.completedRequests.length > 0 ? (
                      <div style={{ marginBottom: '15px' }}>
                        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>Jobs included in this batch:</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                          {dailyCashSummary.completedRequests.map((r) => (
                            <div key={r._id} style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                              <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{r.serviceType}</div>
                              <div style={{ color: '#64748b', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.customerAddress}</div>
                              <div style={{ color: '#059669', fontWeight: 'bold', marginTop: '4px' }}>₹{r.paymentAmount}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '15px' }}>
                        No completed cash jobs logged today. You can still submit ₹0 or manual collection.
                      </p>
                    )}

                    <form onSubmit={handleSubmitHandover}>
                      <div className="input-group" style={{ marginBottom: '15px' }}>
                        <label>Notes / Handover Remarks (Optional)</label>
                        <textarea
                          rows="2"
                          value={handoverNotes}
                          onChange={(e) => setHandoverNotes(e.target.value)}
                          placeholder="e.g. Submitted at central desk, ₹500 x 2 notes..."
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingHandover}
                        className="btn-primary"
                      >
                        {submittingHandover ? 'Submitting...' : dailyCashSummary?.alreadySubmitted ? 'Update Submission' : 'Submit EOD Cash Collection'}
                      </button>
                    </form>
                  </div>
                )}

                {/* Past Submissions History */}
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 15px 0' }}>
                    My Past Handover Submissions
                  </h4>

                  {myHandovers.length === 0 ? (
                    <p style={{ color: '#64748b', fontSize: '13px' }}>No previous submissions recorded.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {myHandovers.map((h) => (
                        <div key={h._id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                          <div>
                            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>{h.date}</span>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                              Declared: <strong style={{ color: '#0f172a' }}>₹{h.totalCollectedCash}</strong>
                              {h.acknowledgedAmount !== null && ` | Received: ₹${h.acknowledgedAmount}`}
                            </div>
                            {h.inchargeNotes && (
                              <div style={{ fontSize: '11px', color: '#4f46e5', marginTop: '4px', fontStyle: 'italic' }}>
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
                                ? '#d1fae5'
                                : h.status === 'DISCREPANCY'
                                ? '#fee2e2'
                                : '#ede9fe',
                              color: h.status === 'ACKNOWLEDGED'
                                ? '#047857'
                                : h.status === 'DISCREPANCY'
                                ? '#b91c1c'
                                : '#6d28d9'
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
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#0f172a' }}>
                  Van Stock & Spare Parts
                </h2>
                <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
                  Manage items carried in your vehicle kit and request stock refills from Store In-Charge.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={openManualIndentModal}
                  className="btn-primary"
                  style={{ padding: '8px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
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
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading your van stock...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                {/* Current Van Stock Grid */}
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#334155', marginBottom: '12px' }}>
                    Current Kit Inventory ({vanInventory.length} Items)
                  </h3>

                  {vanInventory.length === 0 ? (
                    <div style={{ background: '#ffffff', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                      <Package size={28} style={{ color: '#4f46e5', margin: '0 auto 10px auto' }} />
                      <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#0f172a' }}>Your van inventory is currently empty</p>
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
                              background: '#ffffff',
                              border: isLow ? '1px solid #fde68a' : '1px solid #e2e8f0',
                              borderRadius: '12px',
                              padding: '16px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                            }}
                          >
                            <div>
                              <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>{item.category || 'Spare Part'}</span>
                              <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a', margin: '4px 0 6px 0' }}>{item.productName}</h4>
                              {item.sku && <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>SKU: {item.sku}</p>}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                              <div>
                                <span style={{ fontSize: '11px', color: '#64748b' }}>Stock:</span>
                                <span style={{ fontSize: '20px', fontWeight: 'bold', color: isLow ? '#d97706' : '#059669', marginLeft: '6px' }}>{item.quantity}</span>
                              </div>
                              {isLow && (
                                <span style={{ fontSize: '10px', fontWeight: 'bold', background: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: '4px' }}>
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
                  <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#334155', marginBottom: '12px' }}>
                    My Indent Requisitions
                  </h3>

                  {myIndents.length === 0 ? (
                    <p style={{ color: '#64748b', fontSize: '13px' }}>No indent requests submitted yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {myIndents.map((ind) => (
                        <div
                          key={ind._id}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '15px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '10px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>
                                {new Date(ind.requestedAt).toLocaleDateString()}
                              </span>
                              {ind.serviceRequestId && (
                                <span style={{ fontSize: '11px', color: '#4338ca', background: '#e0e7ff', padding: '2px 8px', borderRadius: '10px' }}>
                                  Job: {ind.serviceRequestId.serviceType}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: '#475569', marginTop: '6px' }}>
                              Parts: {ind.items?.map(it => `${it.productName} (x${it.requestedQuantity})`).join(', ')}
                            </div>
                            {ind.inchargeRemarks && (
                              <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px', fontStyle: 'italic' }}>
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
                                ? '#d1fae5'
                                : ind.status === 'REJECTED'
                                ? '#fee2e2'
                                : '#fef3c7',
                              color: ind.status === 'DISPATCHED'
                                ? '#047857'
                                : ind.status === 'REJECTED'
                                ? '#b91c1c'
                                : '#b45309'
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
              <div style={{ background: '#fef3c7', color: '#d97706', padding: '10px', borderRadius: '12px' }}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Insufficient Van Kit Inventory</h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>You lack spare parts to accept this service request.</p>
              </div>
            </div>

            <div style={{ background: '#fef2f2', borderRadius: '12px', padding: '15px', marginBottom: '20px', border: '1px solid #fecaca' }}>
              <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#991b1b', marginBottom: '10px' }}>Required vs Available Stock:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {shortageModalData.missingComponents.map((comp, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    <span style={{ color: '#0f172a', fontWeight: '500' }}>{comp.name}</span>
                    <span style={{ color: '#dc2626', fontWeight: 'bold' }}>
                      Need {comp.requiredQuantity} (Have: {comp.availableQuantity})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>
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
                style={{ flex: 1.5, padding: '10px', fontSize: '13px' }}
                onClick={handleRaiseIndentFromShortage}
              >
                Raise Indent to Store
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL MULTI-ITEM INDENT CREATION MODAL */}
      {showManualIndentModal && (
        <div className="modal-backdrop" onClick={() => setShowManualIndentModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px', width: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Request Spare Parts Indent</h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748b' }}>Select parts from live inventory catalog & request replenishment to your Van Kit</p>
              </div>
              <button
                type="button"
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
                onClick={() => setShowManualIndentModal(false)}
              >
                <AlertCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleManualIndentSubmit} className="dashboard-form">
              <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Required Spare Parts ({manualIndentItems.length})
                  </label>
                  {loadingCatalog && <span style={{ fontSize: '11px', color: '#4f46e5' }}>Loading live catalog...</span>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                  {manualIndentItems.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                          Select Spare Part {item.currentStock !== null ? `(Store Stock: ${item.currentStock})` : ''}
                        </label>
                        {catalogProducts.length > 0 ? (
                          <select
                            value={item.posProductId ? `pos_${item.posProductId}` : (item.productId ? `sms_${item.productId}` : item.productName)}
                            onChange={(e) => {
                              const val = e.target.value;
                              const matched = catalogProducts.find(p => `pos_${p.posProductId || p.id}` === val || `sms_${p._id}` === val || p.name === val);
                              if (matched) {
                                handleSelectProductForRow(idx, matched);
                              } else {
                                handleSelectProductForRow(idx, val);
                              }
                            }}
                            required
                            style={{ width: '100%', background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '8px', borderRadius: '6px', outline: 'none', fontSize: '13px' }}
                          >
                            <option value="">-- Choose Spare Part from Catalog --</option>
                            {catalogProducts.map(p => (
                              <option key={p._id || p.id} value={p.posProductId ? `pos_${p.posProductId}` : (p._id ? `sms_${p._id}` : p.name)}>
                                {p.name} {p.sku ? `(${p.sku})` : ''} — Store Stock: {p.stockLevel ?? p.stock_level ?? 0}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            required
                            placeholder="e.g. 10 inch Spun Filter, RO Pump"
                            value={item.productName}
                            onChange={(e) => handleSelectProductForRow(idx, e.target.value)}
                            style={{ width: '100%', background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '8px', borderRadius: '6px', outline: 'none', fontSize: '13px' }}
                          />
                        )}
                      </div>

                      <div style={{ width: '80px' }}>
                        <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Qty</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.requestedQuantity}
                          onChange={(e) => updateManualIndentQty(idx, e.target.value)}
                          style={{ width: '100%', background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '8px', borderRadius: '6px', outline: 'none', textAlign: 'center', fontWeight: 'bold' }}
                        />
                      </div>

                      {manualIndentItems.length > 1 && (
                        <div style={{ paddingTop: '18px' }}>
                          <button
                            type="button"
                            onClick={() => removeManualIndentRow(idx)}
                            style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}
                            title="Remove item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addManualIndentRow}
                  style={{ width: '100%', marginTop: '10px', padding: '8px', background: '#eff6ff', border: '1px dashed #93c5fd', color: '#2563eb', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Plus size={14} /> + Add Another Spare Part
                </button>
              </div>

              <div className="input-group">
                <label>Reason / Remarks (Optional)</label>
                <textarea
                  rows="2"
                  value={manualIndentRemarks}
                  onChange={(e) => setManualIndentRemarks(e.target.value)}
                  placeholder="e.g. Daily refill for upcoming service calls"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button
                  type="button"
                  onClick={() => setShowManualIndentModal(false)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '10px', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submittingManualIndent}
                  style={{ flex: 1.5, padding: '10px', fontSize: '13px' }}
                >
                  {submittingManualIndent ? 'Submitting Indent...' : `Submit Indent (${manualIndentItems.filter(i => i.productName).length} items)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSESS & ACCEPT SERVICE REQUEST MODAL */}
      {assessingJob && (
        <div className="modal-backdrop" onClick={() => setAssessingJob(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px', width: '95%' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Wrench size={18} style={{ color: '#10b981' }} /> Assess & Accept Service Request
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                  Assess customer requirements and allocate required spare parts from your Van Kit before starting.
                </p>
              </div>
              <button 
                type="button" 
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
                onClick={() => setAssessingJob(null)}
              >
                <AlertCircle size={20} />
              </button>
            </div>

            {/* Customer Details Box */}
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#0f172a' }}>{assessingJob.serviceType}</span>
                <span className="badge badge-assigned">Awaiting Acceptance</span>
              </div>
              <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#475569' }}>{assessingJob.description || 'No special instructions provided'}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', fontSize: '12px', color: '#64748b' }}>
                <div>Client: <strong style={{ color: '#1e293b' }}>{assessingJob.customerId?.name || 'Customer'}</strong></div>
                <div>Phone: <strong style={{ color: '#1e293b' }}>{assessingJob.customerId?.phone || 'N/A'}</strong></div>
                <div style={{ gridColumn: '1 / -1' }}>Address: <strong style={{ color: '#1e293b' }}>{assessingJob.customerAddress}</strong></div>
              </div>
            </div>

            {/* Assessment Option Selection */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Service Inventory Requirement
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setAssessmentMode('NO_PARTS')}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: assessmentMode === 'NO_PARTS' ? '2px solid #10b981' : '1px solid #e2e8f0',
                    background: assessmentMode === 'NO_PARTS' ? '#ecfdf5' : '#ffffff',
                    color: assessmentMode === 'NO_PARTS' ? '#065f46' : '#475569',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={15} color={assessmentMode === 'NO_PARTS' ? '#10b981' : '#94a3b8'} />
                    Service Only (No Parts)
                  </div>
                  <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.85 }}>
                    Labor, inspection, filter wash or diagnostic visit.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAssessmentMode('WITH_PARTS')}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: assessmentMode === 'WITH_PARTS' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                    background: assessmentMode === 'WITH_PARTS' ? '#eff6ff' : '#ffffff',
                    color: assessmentMode === 'WITH_PARTS' ? '#1e40af' : '#475569',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Package size={15} color={assessmentMode === 'WITH_PARTS' ? '#3b82f6' : '#94a3b8'} />
                    Requires Spare Parts
                  </div>
                  <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.85 }}>
                    Select components to allocate from your Van Kit.
                  </div>
                </button>
              </div>
            </div>

            {/* If WITH_PARTS: Spare Parts Selector */}
            {assessmentMode === 'WITH_PARTS' && (
              <div style={{ background: '#f1f5f9', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e293b', textTransform: 'uppercase' }}>
                    Select Parts from Your Van Kit
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    {vanInventory.length} item type(s) currently in your van
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}>
                  {assessmentParts.map((item, idx) => {
                    const isShort = item.name && item.quantity > item.availableStock;
                    return (
                      <div key={idx} style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: isShort ? '1px solid #f87171' : '1px solid #e2e8f0', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '3px' }}>
                            Spare Part {item.name ? `— In Van: ${item.availableStock}` : ''} {item.unitPrice > 0 ? `(₹${item.unitPrice})` : ''}
                          </label>
                          <select
                            value={item.posProductId ? `pos_${item.posProductId}` : (item.productId ? `sms_${item.productId}` : item.name)}
                            onChange={(e) => {
                              const val = e.target.value;
                              const matched = catalogProducts.find(p => `pos_${p.posProductId || p.id}` === val || `sms_${p._id}` === val || p.name === val);
                              if (matched) {
                                handleSelectAssessmentPart(idx, matched);
                              } else {
                                handleSelectAssessmentPart(idx, val);
                              }
                            }}
                            required
                            style={{ width: '100%', background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '7px', borderRadius: '6px', fontSize: '13px' }}
                          >
                            <option value="">-- Choose Spare Part --</option>
                            {catalogProducts.map(p => {
                              const vItem = vanInventory.find(v => 
                                (p.posProductId && Number(v.posProductId) === Number(p.posProductId)) || 
                                (v.productName && v.productName.trim().toLowerCase() === p.name?.trim().toLowerCase())
                              );
                              const vQty = vItem ? vItem.quantity : 0;
                              return (
                                <option key={p._id || p.id} value={p.posProductId ? `pos_${p.posProductId}` : (p._id ? `sms_${p._id}` : p.name)}>
                                  {p.name} {p.sku ? `(${p.sku})` : ''} — Van Stock: {vQty} | ₹{p.price || p.unitPrice || 0}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        <div style={{ width: '75px' }}>
                          <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '3px' }}>Qty</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateAssessmentPartQty(idx, e.target.value)}
                            style={{ width: '100%', background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '7px', borderRadius: '6px', textAlign: 'center', fontWeight: 'bold', fontSize: '13px' }}
                          />
                        </div>

                        {assessmentParts.length > 1 && (
                          <div style={{ paddingTop: '16px' }}>
                            <button
                              type="button"
                              onClick={() => removeAssessmentPartRow(idx)}
                              style={{ background: '#fee2e2', border: 'none', color: '#dc2626', padding: '7px', borderRadius: '6px', cursor: 'pointer' }}
                              title="Remove item"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={addAssessmentPartRow}
                  style={{ width: '100%', marginTop: '10px', padding: '7px', background: '#eff6ff', border: '1px dashed #93c5fd', color: '#2563eb', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                >
                  <Plus size={13} /> + Add Another Spare Part
                </button>

                {/* Live Estimated Parts Cost */}
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                  <span style={{ color: '#475569', fontWeight: 600 }}>Total Parts Value:</span>
                  <span style={{ color: '#0f172a', fontWeight: 'bold', fontSize: '14px' }}>
                    ₹{assessmentParts.reduce((sum, p) => sum + ((Number(p.quantity) || 1) * (Number(p.unitPrice) || 0)), 0)}
                  </span>
                </div>
              </div>
            )}

            {/* Submit / Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button
                type="button"
                onClick={() => setAssessingJob(null)}
                className="btn-secondary"
                style={{ flex: 1, padding: '10px', fontSize: '13px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAcceptJobWithAssessment}
                className="btn-primary"
                disabled={submittingAssessment}
                style={{ flex: 1.6, padding: '10px', fontSize: '13px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: 'none' }}
              >
                {submittingAssessment ? 'Accepting Job...' : assessmentMode === 'WITH_PARTS' ? 'Accept Job with Selected Parts' : 'Accept Job (Service Only)'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Complete Job & Record Payment Breakdown Modal */}
      {completingRequestId && (() => {
        const activeJob = requests.find(r => r._id === completingRequestId);
        const partsList = activeJob?.requiredComponents || [];
        const partsTotal = partsList.reduce(
          (sum, c) => sum + ((Number(c.quantity) || 1) * (Number(c.unitPrice) || 0)),
          0
        );
        const scNum = Math.max(0, Number(serviceCharge) || 0);
        const discNum = Math.max(0, Number(discountAmount) || 0);
        const calcTotal = Math.max(0, (partsTotal + scNum) - discNum);

        return (
          <div className="modal-backdrop" onClick={() => setCompletingRequestId(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px', width: '95%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Receipt size={18} style={{ color: '#059669' }} /> Complete Job & Record Payment
                  </h3>
                  <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                    {activeJob?.serviceType} — {activeJob?.customerId?.name || 'Customer'}
                  </p>
                </div>
                <button 
                  type="button" 
                  style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
                  onClick={() => setCompletingRequestId(null)}
                >
                  <AlertCircle size={20} />
                </button>
              </div>

              {completionError && <div className="error-banner" style={{ marginBottom: '15px' }}>{completionError}</div>}

              <form onSubmit={handleCompleteJobSubmit} className="dashboard-form">
                
                {/* 1. Spare Parts / Inventory Used (Editable) */}
                <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', textTransform: 'uppercase' }}>
                      1. Spare Parts Used ({completionParts.length})
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>
                      Parts Subtotal: ₹{completionParts.reduce((sum, c) => sum + ((Number(c.quantity) || 1) * (Number(c.unitPrice) || 0)), 0)}
                    </span>
                  </div>

                  {/* List of currently attached parts */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '2px' }}>
                    {completionParts.map((item, idx) => (
                      <div key={idx} style={{ background: '#ffffff', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          {item.name ? (
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>
                              {item.name} {item.unitPrice > 0 ? <span style={{ color: '#059669', fontSize: '11px' }}>(₹{item.unitPrice} ea)</span> : ''}
                            </div>
                          ) : (
                            <select
                              value={item.posProductId ? `pos_${item.posProductId}` : (item.productId ? `sms_${item.productId}` : item.name)}
                              onChange={(e) => {
                                const val = e.target.value;
                                const matched = catalogProducts.find(p => `pos_${p.posProductId || p.id}` === val || `sms_${p._id}` === val || p.name === val);
                                if (matched) {
                                  handleSelectCompletionPart(idx, matched);
                                } else {
                                  handleSelectCompletionPart(idx, val);
                                }
                              }}
                              required
                              style={{ width: '100%', background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '6px', borderRadius: '6px', fontSize: '12px' }}
                            >
                              <option value="">-- Pick Extra Part from Van Kit --</option>
                              {catalogProducts.map(p => {
                                const vItem = vanInventory.find(v => 
                                  (p.posProductId && Number(v.posProductId) === Number(p.posProductId)) || 
                                  (v.productName && v.productName.trim().toLowerCase() === p.name?.trim().toLowerCase())
                                );
                                const vQty = vItem ? vItem.quantity : 0;
                                return (
                                  <option key={p._id || p.id} value={p.posProductId ? `pos_${p.posProductId}` : (p._id ? `sms_${p._id}` : p.name)}>
                                    {p.name} — Van Stock: {vQty} | ₹{p.price || p.unitPrice || 0}
                                  </option>
                                );
                              })}
                            </select>
                          )}
                        </div>

                        <div style={{ width: '65px' }}>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateCompletionPartQty(idx, e.target.value)}
                            style={{ width: '100%', background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '4px', borderRadius: '6px', textAlign: 'center', fontWeight: 'bold', fontSize: '12px' }}
                          />
                        </div>

                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a', minWidth: '45px', textAlign: 'right' }}>
                          ₹{(Number(item.unitPrice) || 0) * (Number(item.quantity) || 1)}
                        </div>

                        <button
                          type="button"
                          onClick={() => removeCompletionPartRow(idx)}
                          style={{ background: '#fee2e2', border: 'none', color: '#dc2626', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
                          title="Remove part"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addCompletionPartRow}
                    style={{ width: '100%', marginTop: '8px', padding: '6px', background: '#eff6ff', border: '1px dashed #93c5fd', color: '#2563eb', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    <Plus size={12} /> + Add Extra Part from Van Kit
                  </button>
                </div>

                {/* 2. Service Charge Input */}
                <div className="input-group" style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>2. Service / Labor Charge (INR)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="e.g. 250"
                    value={serviceCharge}
                    onChange={(e) => {
                      setServiceCharge(e.target.value);
                      handlePricingChange(e.target.value, discountAmount);
                    }}
                  />
                </div>

                {/* 3. Discount Input + Incharge Notice */}
                <div className="input-group" style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>3. Discount Applied (INR)</span>
                    <span style={{ fontSize: '11px', color: '#b45309', fontWeight: 600 }}>* Pre-confirm with Store In-Charge</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 50"
                    value={discountAmount}
                    onChange={(e) => {
                      setDiscountAmount(e.target.value);
                      handlePricingChange(serviceCharge, e.target.value);
                    }}
                  />
                  {discNum > 0 && (
                    <input
                      type="text"
                      placeholder="Discount reason / approved by Store In-Charge..."
                      value={discountRemarks}
                      onChange={(e) => setDiscountRemarks(e.target.value)}
                      style={{ marginTop: '6px', fontSize: '12px' }}
                    />
                  )}
                </div>

                {/* 4. Total Amount Box */}
                <div style={{
                  background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
                  border: '1px solid #a7f3d0',
                  borderRadius: '12px',
                  padding: '14px',
                  marginBottom: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#047857', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Net Payable Amount
                    </span>
                    <div style={{ fontSize: '11px', color: '#065f46', marginTop: '2px' }}>
                      (Parts ₹{partsTotal} + Service ₹{scNum}) − Discount ₹{discNum}
                    </div>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#065f46' }}>
                    ₹{calcTotal}
                  </div>
                </div>

                {/* Payment Method */}
                <div className="input-group" style={{ marginBottom: '14px' }}>
                  <label>Payment Collection Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="Cash">Cash Payment</option>
                    <option value="UPI / Online">UPI / Online QR Payment</option>
                    <option value="Card">Debit / Credit Card</option>
                  </select>
                </div>

                <div style={{ color: '#64748b', fontSize: '11px', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
                  📸 Ensure you have uploaded the <strong>After Service photo</strong> before completing this job.
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    style={{ flex: 1, padding: '10px' }}
                    onClick={() => setCompletingRequestId(null)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary" 
                    disabled={completionLoading}
                    style={{ flex: 1.5, padding: '10px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: 'none' }}
                  >
                    {completionLoading ? 'Completing Job...' : `Confirm & Collect ₹${calcTotal}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default AgentDashboard;
