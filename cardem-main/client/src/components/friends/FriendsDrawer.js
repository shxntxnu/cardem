import React, { useState } from 'react';
import PropTypes from 'prop-types';

const FriendsDrawer = ({
  isOpen,
  onClose,
  friends,
  myFriendCode,
  onAddFriend,
  onRemoveFriend,
  onViewFriend
}) => {
  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    if (myFriendCode) {
      navigator.clipboard.writeText(myFriendCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    setSubmitting(true);
    await onAddFriend(inputCode.trim().toUpperCase());
    setSubmitting(false);
    setInputCode('');
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div
        className="friends-drawer hud-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer-header">
          <div className="drawer-title">
            <h2>
              <i className="fa-solid fa-user-group text-cyan"></i> Fleet Friends ({friends.length})
            </h2>
            <p className="subtitle">Connect with drivers, inspect garages, and coordinate live convoys.</p>
          </div>
          <button className="btn-close" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        {/* User's Own Unique Friend Code Card */}
        <div className="my-friend-code-card">
          <div className="code-label-group">
            <span className="code-eyebrow">YOUR UNIQUE DRIVER CODE</span>
            <span className="code-subtext">Share this code with fellow enthusiasts to connect fleets</span>
          </div>
          <div className="code-display-box">
            <span className="unique-code-text">{myFriendCode || 'CRD-ACTIVE'}</span>
            <button
              className={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline'}`}
              onClick={handleCopyCode}
              title="Copy to Clipboard"
            >
              <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'}`}></i>
              {copied ? ' Copied!' : ' Copy'}
            </button>
          </div>
        </div>

        {/* Add Friend Input Form */}
        <form onSubmit={handleAddSubmit} className="add-friend-form">
          <label className="form-label">
            <i className="fa-solid fa-key"></i> Add Driver by Code
          </label>
          <div className="add-friend-input-group">
            <input
              type="text"
              placeholder="e.g. CRD-8F2B4K"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              className="form-input code-input"
              maxLength={12}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !inputCode.trim()}
            >
              {submitting ? (
                <i className="fa-solid fa-spinner fa-spin"></i>
              ) : (
                <>
                  <i className="fa-solid fa-user-plus"></i> Connect
                </>
              )}
            </button>
          </div>
        </form>

        {/* Friends List */}
        <div className="friends-list-container">
          <span className="section-label">CONNECTED DRIVERS</span>

          {friends.length === 0 ? (
            <div className="empty-friends-state">
              <div className="empty-icon">🏎️ 💨</div>
              <h4>No drivers connected yet</h4>
              <p>Share your code above or enter a friend's code to link your fleet garages!</p>
            </div>
          ) : (
            <div className="friends-grid">
              {friends.map((friend) => {
                const u = friend.user;
                const primary = friend.primary_vehicle;
                return (
                  <div key={friend._id || u?._id} className="friend-card hud-card animate-fade-in">
                    <div className="friend-card-header">
                      <div className="friend-avatar-wrap">
                        <img
                          src={u?.avatar || 'https://www.gravatar.com/avatar/?d=retro'}
                          alt={u?.name}
                          className="friend-avatar-img"
                        />
                        <span className="online-indicator" title="Connected"></span>
                      </div>
                      <div className="friend-info">
                        <h4>{u?.name}</h4>
                        <span className="friend-callsign">
                          {friend.handle ? `@${friend.handle}` : `@${u?.name?.toLowerCase().replace(/\s+/g, '')}`}
                        </span>
                        <div className="friend-tags">
                          <span className="badge badge-cyan badge-xs">
                            {friend.driving_style || 'Spirited'}
                          </span>
                          <span className="badge badge-emerald badge-xs">
                            🛡️ {friend.overall_safety_rating || 95}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Primary Vehicle Pill */}
                    <div className="friend-primary-vehicle">
                      <span className="vehicle-icon">
                        {primary?.vehicle_type?.toLowerCase() === 'motorcycle' ? '🏍️' : '🏎️'}
                      </span>
                      <div className="vehicle-desc">
                        {primary ? (
                          <>
                            <span className="vehicle-name">{primary.year} {primary.make} {primary.model}</span>
                            {primary.horsepower && <span className="vehicle-hp">{primary.horsepower} HP</span>}
                          </>
                        ) : (
                          <span className="vehicle-empty">No active vehicle parked</span>
                        )}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="friend-card-actions">
                      <button
                        className="btn btn-primary btn-sm flex-1"
                        onClick={() => onViewFriend(u?._id)}
                      >
                        <i className="fa-solid fa-eye"></i> View Fleet & Stats
                      </button>
                      <button
                        className="btn btn-danger-ghost btn-sm btn-icon"
                        onClick={() => onRemoveFriend(u?._id)}
                        title="Remove Friend"
                      >
                        <i className="fa-solid fa-user-xmark"></i>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

FriendsDrawer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  friends: PropTypes.array.isRequired,
  myFriendCode: PropTypes.string,
  onAddFriend: PropTypes.func.isRequired,
  onRemoveFriend: PropTypes.func.isRequired,
  onViewFriend: PropTypes.func.isRequired
};

export default FriendsDrawer;
