import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../actions/auth';
import EditAccountModal from '../profile/EditAccountModal';

const Navbar = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const auth = useSelector((state) => state.auth);
  const convoy = useSelector((state) => state.convoy);

  const { isAuthenticated, loading, user } = auth;
  const { activeConvoy } = convoy;
  const [showEditModal, setShowEditModal] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Top Mobile Bar */}
      <header className="mobile-top-bar">
        <div className="top-bar-inner">
          <Link to="/" className="brand-logo">
            <div className="brand-icon-gauge">
              <i className="fa-solid fa-gauge-high"></i>
            </div>
            <span className="brand-text">CARDEM</span>
          </Link>

          <div className="top-bar-actions">
            {activeConvoy && (
              <Link to={`/convoy/${activeConvoy._id}`} className="active-convoy-pill pulse-glow">
                <span className="live-dot"></span>
                <span className="convoy-name-clamp">{activeConvoy.name}</span>
                <i className="fa-solid fa-location-arrow"></i>
              </Link>
            )}

            {!loading && isAuthenticated && user && (
              <div className="user-profile-badge">
                <button
                  type="button"
                  className="user-avatar-btn"
                  onClick={() => setShowEditModal(true)}
                  title="Edit Profile & Account"
                >
                  <img
                    src={user.avatar || 'https://www.gravatar.com/avatar/?d=mp'}
                    alt={user.name}
                    className="user-avatar-tiny"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  className="settings-gear-btn"
                  title="Edit Account Settings"
                >
                  <i className="fa-solid fa-gear"></i>
                </button>
                <button onClick={handleLogout} className="logout-btn" title="Sign Out">
                  <i className="fa-solid fa-arrow-right-from-bracket"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Edit Profile & Account Modal */}
      <EditAccountModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
      />

      {/* Bottom Mobile Navigation Dock */}
      {!loading && isAuthenticated && (
        <nav className="mobile-bottom-dock">
          <div className="dock-inner">
            <Link to="/dashboard" className={`dock-tab ${isActive('/dashboard') ? 'active' : ''}`}>
              <i className="fa-solid fa-house-chimney"></i>
              <span>Hub</span>
            </Link>

            <Link to="/garage" className={`dock-tab ${isActive('/garage') ? 'active' : ''}`}>
              <i className="fa-solid fa-warehouse"></i>
              <span>Garage</span>
            </Link>

            <Link
              to={activeConvoy ? `/convoy/${activeConvoy._id}` : '/convoys'}
              className={`dock-tab dock-tab-center ${location.pathname.startsWith('/convoy') ? 'active' : ''}`}
            >
              <div className="center-tab-bubble">
                <i className="fa-solid fa-map-location-dot"></i>
              </div>
              <span>Convoy</span>
            </Link>

            <Link to="/alerts" className={`dock-tab ${isActive('/alerts') ? 'active' : ''}`}>
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span>Alerts</span>
            </Link>

            <Link to="/leaderboard" className={`dock-tab ${isActive('/leaderboard') ? 'active' : ''}`}>
              <i className="fa-solid fa-trophy"></i>
              <span>Ranks</span>
            </Link>
          </div>
        </nav>
      )}
    </>
  );
};

export default Navbar;
