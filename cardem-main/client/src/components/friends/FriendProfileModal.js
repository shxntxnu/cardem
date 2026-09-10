import React from 'react';
import PropTypes from 'prop-types';

const FriendProfileModal = ({ friendData, onClose }) => {
  if (!friendData) return null;

  const { profile, stats } = friendData;
  const user = profile?.user;
  const garage = profile?.garage || [];
  const primaryVehicle = garage.find((v) => v.is_primary) || garage[0];
  const summaryStats = stats?.summary;

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div
        className="hud-card modal-content friend-profile-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="friend-modal-title">
            <span className="badge badge-cyan">
              <i className="fa-solid fa-user-astronaut"></i> Fleet Friend
            </span>
            <h2>{user?.name || 'Driver Profile'}</h2>
          </div>
          <button className="btn-close" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        <div className="friend-modal-body">
          {/* Read-Only Notice Alert */}
          <div className="readonly-banner">
            <i className="fa-solid fa-lock"></i>
            <span>
              <strong>Read-Only Mode:</strong> You are inspecting {user?.name}'s enthusiast profile, fleet, and performance metrics.
            </span>
          </div>

          {/* Hero Driver Identity Banner */}
          <div className="friend-hero-card">
            <div className="friend-hero-left">
              <div className="driver-avatar-ring">
                <img
                  src={user?.avatar || 'https://www.gravatar.com/avatar/?d=retro'}
                  alt={user?.name}
                  className="driver-avatar-img"
                />
                <div className="verified-badge" title="Verified Driver">
                  <i className="fa-solid fa-circle-check"></i>
                </div>
              </div>
              <div className="friend-hero-info">
                <h3>{user?.name}</h3>
                <div className="friend-callsign">
                  {profile?.handle ? `@${profile.handle}` : `@${user?.name?.toLowerCase().replace(/\s+/g, '')}`}
                </div>
                {profile?.location && (
                  <div className="friend-location">
                    <i className="fa-solid fa-location-dot"></i> {profile.location}
                  </div>
                )}
                <div className="driver-tags mt-1">
                  <span className="badge badge-cyan">
                    <i className="fa-solid fa-gauge"></i> {profile?.driving_style || 'Spirited Driver'}
                  </span>
                  <span className="badge badge-purple">
                    <i className="fa-solid fa-trophy"></i> {profile?.experience_level || 'Intermediate'}
                  </span>
                </div>
              </div>
            </div>

            {/* Social Links if provided */}
            {profile?.social && (
              <div className="friend-social-links">
                {profile.social.instagram && (
                  <a
                    href={`https://instagram.com/${profile.social.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-pill instagram"
                  >
                    <i className="fa-brands fa-instagram"></i> {profile.social.instagram}
                  </a>
                )}
                {profile.social.youtube && (
                  <a
                    href={`https://youtube.com/${profile.social.youtube}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-pill youtube"
                  >
                    <i className="fa-brands fa-youtube"></i> YouTube
                  </a>
                )}
                {profile.social.twitter && (
                  <a
                    href={`https://x.com/${profile.social.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-pill twitter"
                  >
                    <i className="fa-brands fa-x-twitter"></i> {profile.social.twitter}
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Bio statement */}
          {profile?.bio && (
            <div className="friend-bio-card">
              <span className="label-caption">DRIVER BIO</span>
              <p>"{profile.bio}"</p>
            </div>
          )}

          {/* Performance & Driving Statistics */}
          <div className="friend-section-header">
            <h4>
              <i className="fa-solid fa-chart-line text-cyan"></i> Verified Telemetry & Stats
            </h4>
          </div>
          <div className="driver-metrics-ribbon friend-metrics">
            <div className="metric-cell">
              <span className="metric-label">Safety Rating</span>
              <span className="metric-value highlight-emerald">
                {profile?.overall_safety_rating || summaryStats?.average_safety_score || 95}%
              </span>
            </div>
            <div className="metric-cell">
              <span className="metric-label">Total Distance</span>
              <span className="metric-value">
                {summaryStats?.total_distance_km || 0} <span className="unit">km</span>
              </span>
            </div>
            <div className="metric-cell">
              <span className="metric-label">Top Speed Logged</span>
              <span className="metric-value highlight-cyan">
                {summaryStats?.max_speed_kph || 0} <span className="unit">km/h</span>
              </span>
            </div>
            <div className="metric-cell">
              <span className="metric-label">Total Drives</span>
              <span className="metric-value">
                {summaryStats?.total_drives || profile?.total_convoys_completed || 0}
              </span>
            </div>
          </div>

          {/* Primary Ride Highlight */}
          {primaryVehicle && (
            <div className="primary-ride-banner hud-card mt-3">
              <div className="ride-badge">Active Primary Ride</div>
              <div className="ride-content">
                <div className="ride-icon">
                  {primaryVehicle.vehicle_type?.toLowerCase() === 'motorcycle' || primaryVehicle.type === 'motorcycle' ? '🏍️' : '🏎️'}
                </div>
                <div className="ride-info">
                  <h2>{primaryVehicle.year} {primaryVehicle.make} {primaryVehicle.model}</h2>
                  {primaryVehicle.nickname && (
                    <p className="ride-nickname">"{primaryVehicle.nickname}"</p>
                  )}
                  <div className="ride-specs">
                    {primaryVehicle.horsepower && (
                      <span className="spec-pill">⚡ {primaryVehicle.horsepower} HP</span>
                    )}
                    {primaryVehicle.color && (
                      <span className="spec-pill">🎨 {primaryVehicle.color}</span>
                    )}
                    <span className="spec-pill">🏷️ {(primaryVehicle.vehicle_type || primaryVehicle.type || 'Car').toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Garage Fleet Showcase */}
          <div className="friend-section-header mt-3">
            <h4>
              <i className="fa-solid fa-warehouse text-purple"></i> Garage Fleet ({garage.length})
            </h4>
          </div>

          {garage.length === 0 ? (
            <div className="empty-fleet-state">
              <i className="fa-solid fa-car-side"></i>
              <p>This driver has not added any vehicles to their garage yet.</p>
            </div>
          ) : (
            <div className="garage-grid friend-garage-grid">
              {garage.map((veh) => (
                <div
                  key={veh._id}
                  className={`vehicle-card hud-card ${veh.is_primary ? 'is-active' : ''}`}
                >
                  <div className="vehicle-card-top">
                    <span className="vehicle-type-icon">
                      {veh.vehicle_type?.toLowerCase() === 'motorcycle' || veh.type === 'motorcycle' ? '🏍️' : '🏎️'}
                    </span>
                    {veh.is_primary && (
                      <span className="badge badge-success">ACTIVE RIDE</span>
                    )}
                  </div>

                  <div className="vehicle-card-body">
                    <h3>{veh.year} {veh.make} {veh.model}</h3>
                    {veh.nickname && <p className="text-dim">"{veh.nickname}"</p>}

                    <div className="specs-list">
                      <div className="spec-item">
                        <span className="spec-label">Power</span>
                        <span className="spec-val">
                          {veh.horsepower ? `${veh.horsepower} HP` : 'Stock'}
                        </span>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">Color</span>
                        <span className="spec-val">{veh.color || 'Custom'}</span>
                      </div>
                    </div>

                    {((veh.modifications && veh.modifications.length > 0) || (veh.mods && veh.mods.length > 0)) && (
                      <div className="mods-container">
                        <span className="mods-title">Modifications:</span>
                        <div className="mods-tags">
                          {(veh.modifications || veh.mods).map((m, idx) => (
                            <span key={idx} className="mod-tag">{m}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

FriendProfileModal.propTypes = {
  friendData: PropTypes.object,
  onClose: PropTypes.func.isRequired
};

export default FriendProfileModal;
