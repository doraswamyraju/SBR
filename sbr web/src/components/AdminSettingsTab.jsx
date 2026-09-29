import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Star, 
  ExternalLink, 
  Save, 
  User, 
  Lock, 
  Phone, 
  Mail, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Globe, 
  Headphones,
  Check
} from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const AdminSettingsTab = () => {
  const { user } = useAuth();

  // Settings State
  const [reviewUrl, setReviewUrl] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [settingsError, setSettingsError] = useState('');

  // Profile State
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Active Sub-Tab: 'general' | 'profile' | 'security'
  const [activeSubTab, setActiveSubTab] = useState('general');

  const fetchSettings = async () => {
    setLoadingSettings(true);
    setSettingsError('');
    try {
      const res = await api.get('api/settings');
      if (res.success && res.data) {
        setReviewUrl(res.data.reviewUrl || '');
        setSupportPhone(res.data.supportPhone || '');
        setSupportEmail(res.data.supportEmail || '');
      }
    } catch (err) {
      setSettingsError(err.message || 'Failed to load system settings');
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    if (user) {
      setProfileName(user.name || '');
      setProfilePhone(user.phone || '');
    }
  }, [user]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess('');
    setSettingsError('');

    try {
      await api.put('api/settings', { key: 'reviewUrl', value: reviewUrl.trim() });
      if (supportPhone.trim()) {
        await api.put('api/settings', { key: 'supportPhone', value: supportPhone.trim() });
      }
      if (supportEmail.trim()) {
        await api.put('api/settings', { key: 'supportEmail', value: supportEmail.trim() });
      }

      setSettingsSuccess('Settings updated successfully! Changes will reflect across Web, iOS, and Android apps.');
      setTimeout(() => setSettingsSuccess(''), 5000);
    } catch (err) {
      setSettingsError(err.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess('');
    setProfileError('');

    try {
      const res = await api.put('api/users/profile', {
        name: profileName.trim(),
        phone: profilePhone.trim()
      });

      if (res.success) {
        setProfileSuccess('Profile details updated successfully!');
        setTimeout(() => setProfileSuccess(''), 5000);
      } else {
        throw new Error(res.error || 'Failed to update profile');
      }
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      const targetUserId = user?.id || user?._id;
      if (!targetUserId) throw new Error('User ID not found');

      const res = await api.post(`api/users/${targetUserId}/manual-password`, {
        password: newPassword
      });

      if (res.success) {
        setPasswordSuccess('Password updated successfully! Please use this new password for your next login.');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(''), 6000);
      } else {
        throw new Error(res.error || 'Failed to update password');
      }
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="admin-settings-tab" style={{ padding: '0 4px', maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', margin: 0 }}>
            System Settings & Profile
          </h2>
          <p style={{ color: '#6b7280', fontSize: '13px', margin: '4px 0 0 0' }}>
            Manage Google review links, customer support info, and administrator account security.
          </p>
        </div>

        <button 
          className="btn-secondary" 
          onClick={fetchSettings}
          disabled={loadingSettings}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
        >
          <RefreshCw size={14} className={loadingSettings ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Sub Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '10px',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: '12px',
        marginBottom: '24px'
      }}>
        <button
          onClick={() => setActiveSubTab('general')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: activeSubTab === 'general' ? '#1e3a8a' : '#f3f4f6',
            color: activeSubTab === 'general' ? '#ffffff' : '#4b5563'
          }}
        >
          <Globe size={16} /> App & Review Settings
        </button>

        <button
          onClick={() => setActiveSubTab('profile')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: activeSubTab === 'profile' ? '#1e3a8a' : '#f3f4f6',
            color: activeSubTab === 'profile' ? '#ffffff' : '#4b5563'
          }}
        >
          <User size={16} /> Admin Profile
        </button>

        <button
          onClick={() => setActiveSubTab('security')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: activeSubTab === 'security' ? '#1e3a8a' : '#f3f4f6',
            color: activeSubTab === 'security' ? '#ffffff' : '#4b5563'
          }}
        >
          <Shield size={16} /> Password & Security
        </button>
      </div>

      {/* SUB-TAB 1: APP & REVIEW SETTINGS */}
      {activeSubTab === 'general' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* Main Settings Card */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{
                background: '#fef3c7',
                padding: '8px',
                borderRadius: '8px',
                color: '#d97706',
                display: 'flex'
              }}>
                <Star size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', margin: 0 }}>
                  Google Review & App Links
                </h3>
                <p style={{ color: '#6b7280', fontSize: '12px', margin: 0 }}>
                  Controls the review link prompted to customers upon service completion
                </p>
              </div>
            </div>

            {settingsSuccess && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '8px',
                color: '#065f46',
                fontSize: '13px',
                marginBottom: '16px'
              }}>
                <CheckCircle size={16} />
                <span>{settingsSuccess}</span>
              </div>
            )}

            {settingsError && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#991b1b',
                fontSize: '13px',
                marginBottom: '16px'
              }}>
                <AlertCircle size={16} />
                <span>{settingsError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings}>
              {/* Google Review URL */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                  Google Maps / Business Review URL *
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="url"
                    className="custom-input"
                    value={reviewUrl}
                    onChange={(e) => setReviewUrl(e.target.value)}
                    placeholder="https://g.page/r/YOUR_ID/review or https://maps.app.goo.gl/..."
                    required
                    style={{ flex: 1, padding: '10px 12px', fontSize: '13px' }}
                  />
                  {reviewUrl && (
                    <a
                      href={reviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary"
                      title="Test open link in new tab"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 12px',
                        textDecoration: 'none'
                      }}
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
                <span style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                  When agents complete requests or customers tap "Leave Review", this exact URL will open.
                </span>
              </div>

              {/* Support Phone */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                  Customer Support Phone
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input
                    type="text"
                    className="custom-input"
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    placeholder="+91 99000 00000"
                    style={{ width: '100%', padding: '10px 12px 10px 36px', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* Support Email */}
              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                  Customer Support Email
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input
                    type="email"
                    className="custom-input"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    placeholder="support@sribalajirenewables.com"
                    style={{ width: '100%', padding: '10px 12px 10px 36px', fontSize: '13px' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={savingSettings || loadingSettings}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '12px',
                  fontWeight: '600',
                  fontSize: '14px',
                  background: '#1e3a8a'
                }}
              >
                {savingSettings ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                {savingSettings ? 'Saving Settings...' : 'Save App Configuration'}
              </button>
            </form>
          </div>

          {/* Info Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              background: '#f8fafc',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e2e8f0'
            }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Headphones size={18} color="#1e3a8a" /> How Dynamic Settings Work
              </h4>
              <ul style={{ margin: 0, paddingLeft: '18px', color: '#475569', fontSize: '12px', lineHeight: '1.8' }}>
                <li>The <strong>Google Review URL</strong> is fetched dynamically by the Android and iOS apps whenever a customer completes a job.</li>
                <li>Updating the link here takes effect <strong>immediately</strong> without requiring app store updates or APK rebuilds.</li>
                <li>Ensure the link begins with <code>https://</code> so all mobile browsers can open it directly.</li>
              </ul>
            </div>

            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#111827', margin: '0 0 12px 0' }}>
                Current Active Review URL
              </h4>
              <div style={{
                background: '#f1f5f9',
                padding: '12px',
                borderRadius: '8px',
                wordBreak: 'break-all',
                fontSize: '12px',
                color: '#1e293b',
                fontFamily: 'monospace'
              }}>
                {reviewUrl || 'No review URL configured yet.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: ADMIN PROFILE */}
      {activeSubTab === 'profile' && (
        <div style={{ maxWidth: '600px' }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{
                background: '#eff6ff',
                padding: '10px',
                borderRadius: '50%',
                color: '#1e3a8a',
                display: 'flex'
              }}>
                <User size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', margin: 0 }}>
                  Administrator Profile Details
                </h3>
                <p style={{ color: '#6b7280', fontSize: '12px', margin: 0 }}>
                  Manage your personal display name and contact phone number
                </p>
              </div>
            </div>

            {profileSuccess && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '8px',
                color: '#065f46',
                fontSize: '13px',
                marginBottom: '16px'
              }}>
                <CheckCircle size={16} />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#991b1b',
                fontSize: '13px',
                marginBottom: '16px'
              }}>
                <AlertCircle size={16} />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                  Email Address (Login Identity)
                </label>
                <input
                  type="email"
                  className="custom-input"
                  value={user?.email || ''}
                  disabled
                  style={{ width: '100%', padding: '10px 12px', background: '#f3f4f6', cursor: 'not-allowed', color: '#6b7280' }}
                />
                <span style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px', display: 'block' }}>
                  Login email is permanent and cannot be altered.
                </span>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  className="custom-input"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Admin Name"
                  required
                  style={{ width: '100%', padding: '10px 12px' }}
                />
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                  Phone Number
                </label>
                <input
                  type="text"
                  className="custom-input"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="+91 1234567890"
                  style={{ width: '100%', padding: '10px 12px' }}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={savingProfile}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '12px',
                  fontWeight: '600',
                  fontSize: '14px',
                  background: '#1e3a8a'
                }}
              >
                {savingProfile ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                {savingProfile ? 'Saving Profile...' : 'Save Profile Details'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: PASSWORD & SECURITY */}
      {activeSubTab === 'security' && (
        <div style={{ maxWidth: '600px' }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{
                background: '#fef2f2',
                padding: '10px',
                borderRadius: '50%',
                color: '#dc2626',
                display: 'flex'
              }}>
                <Lock size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', margin: 0 }}>
                  Change Administrator Password
                </h3>
                <p style={{ color: '#6b7280', fontSize: '12px', margin: 0 }}>
                  Update your login password securely
                </p>
              </div>
            </div>

            {passwordSuccess && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '8px',
                color: '#065f46',
                fontSize: '13px',
                marginBottom: '16px'
              }}>
                <CheckCircle size={16} />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#991b1b',
                fontSize: '13px',
                marginBottom: '16px'
              }}>
                <AlertCircle size={16} />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleSavePassword}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                  New Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="custom-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter at least 6 characters"
                    required
                    style={{ width: '100%', padding: '10px 38px 10px 12px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#9ca3af'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                  Confirm New Password *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="custom-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  style={{ width: '100%', padding: '10px 12px' }}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={savingPassword}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '12px',
                  fontWeight: '600',
                  fontSize: '14px',
                  background: '#dc2626'
                }}
              >
                {savingPassword ? <RefreshCw size={16} className="animate-spin" /> : <Lock size={16} />}
                {savingPassword ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettingsTab;
