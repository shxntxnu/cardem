import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { updateAccountProfile } from '../../actions/auth';
import { AVATAR_PRESETS } from '../../utils/avatarPresets';

const EditAccountModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
  const profileState = useSelector((state) => state.profile);

  const { user } = auth;
  const { profile } = profileState;

  const [name, setName] = useState(user?.name || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || AVATAR_PRESETS[0].svgDataUri);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const [drivingStyle, setDrivingStyle] = useState(profile?.driving_style || 'Spirited Driver');
  const [experienceLevel, setExperienceLevel] = useState(profile?.experience_level || 'Intermediate');
  const [bio, setBio] = useState(profile?.bio || '');

  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Username is required.');
      return;
    }

    if (name.trim().length < 2) {
      setErrorMessage('Username must be at least 2 characters.');
      return;
    }

    if (newPassword) {
      if (!currentPassword) {
        setErrorMessage('Current password is required to set a new password.');
        return;
      }
      if (newPassword.length < 6) {
        setErrorMessage('New password must be at least 6 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage('New passwords do not match.');
        return;
      }
    }

    setIsSubmitting(true);

    const payload = {
      name: name.trim(),
      avatar: selectedAvatar,
      driving_style: drivingStyle,
      experience_level: experienceLevel,
      bio
    };

    if (newPassword) {
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }

    const result = await dispatch(updateAccountProfile(payload));
    setIsSubmitting(false);

    if (result && result.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } else if (result && result.error) {
      setErrorMessage(result.error);
    }
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div
        className="hud-card modal-content modal-profile-edit animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="title-with-icon">
            <span className="modal-header-icon">⚙️</span>
            <div>
              <h2>Edit Profile & Account</h2>
              <p className="subtitle">Manage your driver handle, preset avatar, and credentials</p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        {errorMessage && (
          <div className="alert-inline alert-danger animate-fade-in mt-2">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="edit-account-form">
          {/* Avatar Section: Safe Presets Only */}
          <div className="form-section-group mt-3">
            <div className="section-label-row">
              <label className="section-title">
                <i className="fa-solid fa-shield-halved text-cyan"></i> Driver Avatar Insignia
              </label>
              <span className="safety-tag">
                <i className="fa-solid fa-lock"></i> No photos for road safety
              </span>
            </div>
            <p className="field-hint">
              For identity protection and safety on public maps, choose a racing insignia or preset avatar.
            </p>

            {/* Current Selected Avatar Preview */}
            <div className="avatar-preview-banner">
              <div className="avatar-preview-ring">
                <img src={selectedAvatar} alt="Selected Insignia" className="avatar-preview-img" />
              </div>
              <div className="avatar-preview-details">
                <span className="preview-label">Active Badge:</span>
                <span className="preview-name">
                  {AVATAR_PRESETS.find((p) => p.svgDataUri === selectedAvatar)?.name || 'Custom Presets'}
                </span>
                <span className="preview-tag">
                  {AVATAR_PRESETS.find((p) => p.svgDataUri === selectedAvatar)?.tag || 'Fleet Ready'}
                </span>
              </div>
            </div>

            {/* Preset Avatars Grid */}
            <div className="avatar-presets-grid mt-2">
              {AVATAR_PRESETS.map((preset) => {
                const isSelected = selectedAvatar === preset.svgDataUri;
                return (
                  <button
                    type="button"
                    key={preset.id}
                    className={`avatar-preset-btn ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => setSelectedAvatar(preset.svgDataUri)}
                    title={preset.name}
                  >
                    <div className="preset-img-wrapper" style={{ borderColor: isSelected ? preset.borderColor : 'transparent' }}>
                      <img src={preset.svgDataUri} alt={preset.name} className="preset-thumb" />
                      {isSelected && (
                        <div className="preset-check-badge">
                          <i className="fa-solid fa-check"></i>
                        </div>
                      )}
                    </div>
                    <span className="preset-btn-name">{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Username Section with Uniqueness Enforcement */}
          <div className="form-section-group mt-4">
            <label className="section-title" htmlFor="username-input">
              <i className="fa-solid fa-id-card text-purple"></i> Driver Username (Unique Callsign)
            </label>
            <div className="input-with-prefix">
              <span className="input-prefix">@</span>
              <input
                id="username-input"
                type="text"
                className="form-input username-field"
                placeholder="Enter unique username"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={30}
                required
              />
            </div>
            <p className="field-hint">
              <i className="fa-solid fa-circle-info"></i> Username is unique platform-wide across all drivers. Case-insensitive collision protection is active.
            </p>
          </div>

          {/* Driver Style & Experience */}
          <div className="form-section-group mt-3">
            <div className="form-group-row">
              <div className="form-group">
                <label className="field-label">Driving Style</label>
                <select
                  value={drivingStyle}
                  onChange={(e) => setDrivingStyle(e.target.value)}
                  className="form-input form-select"
                >
                  <option value="Spirited Driver">🏎️ Spirited Driver</option>
                  <option value="Canyon Carver">🏍️ Canyon Carver</option>
                  <option value="Track Day Racer">🏁 Track Day Racer</option>
                  <option value="Cruiser">🛣️ Cruiser</option>
                  <option value="Adventure Rider">🏔️ Adventure Rider</option>
                </select>
              </div>

              <div className="form-group">
                <label className="field-label">Experience Level</label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="form-input form-select"
                >
                  <option value="Novice">Novice</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Track Expert">Track Expert</option>
                </select>
              </div>
            </div>

            <div className="form-group mt-2">
              <label className="field-label">Driver Bio / Motto</label>
              <textarea
                className="form-input bio-textarea"
                rows={2}
                placeholder="Share your driving philosophy or favorite roads..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={200}
              />
            </div>
          </div>

          {/* Password Section (Optional Toggle) */}
          <div className="form-section-group mt-3">
            <button
              type="button"
              className="btn-toggle-password-section"
              onClick={() => setShowPasswordSection(!showPasswordSection)}
            >
              <span>
                <i className="fa-solid fa-key text-gold"></i> Change Password
              </span>
              <i className={`fa-solid fa-chevron-${showPasswordSection ? 'up' : 'down'}`}></i>
            </button>

            {showPasswordSection && (
              <div className="password-fields-box animate-fade-in mt-2">
                <div className="form-group">
                  <label className="field-label">Current Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>

                <div className="form-group-row mt-2">
                  <div className="form-group">
                    <label className="field-label">New Password</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Min 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="field-label">Confirm New Password</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Repeat new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="modal-actions mt-4">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-glow"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span>
                  <i className="fa-solid fa-circle-notch fa-spin"></i> Saving...
                </span>
              ) : (
                <span>
                  <i className="fa-solid fa-check"></i> Save Profile Changes
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

EditAccountModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default EditAccountModal;
