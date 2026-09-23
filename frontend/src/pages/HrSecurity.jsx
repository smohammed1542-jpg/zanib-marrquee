import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { changePassword } from '../api/auth';
import { usePageTitle } from '../context/PageTitleContext';

export default function HrSecurity() {
  usePageTitle('Security');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const { current_password, new_password, confirm_password } = passwordForm;
    if (new_password.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (new_password !== confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    setIsSaving(true);
    try {
      await changePassword({ current_password, new_password, confirm_password });
      toast.success('Password updated successfully');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      const data = err.response?.data;
      toast.error(
        data?.current_password?.[0]
        || data?.new_password?.[0]
        || data?.confirm_password?.[0]
        || data?.detail
        || 'Failed to update password',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="staff-page animate-fade-in">
      <div className="page-header">
        <div>
          <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 800 }}>Account Security</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Update your login password.
          </p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '520px', padding: '24px' }}>
        <form onSubmit={handleChangePassword} className="staff-modal__form" noValidate>
          <div className="input-group">
            <label>Current password</label>
            <div className="staff-modal__password">
              <Lock size={18} className="staff-modal__password-icon" aria-hidden />
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                required
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="staff-modal__password-toggle"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="input-group">
            <label>New password</label>
            <div className="staff-modal__password">
              <Lock size={18} className="staff-modal__password-icon" aria-hidden />
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="staff-modal__password-toggle"
                onClick={() => setShowNewPassword(!showNewPassword)}
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="input-group">
            <label>Confirm new password</label>
            <div className="staff-modal__password">
              <Lock size={18} className="staff-modal__password-icon" aria-hidden />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="staff-modal__password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="btn-primary"
            disabled={isSaving}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Save size={16} /> {isSaving ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
