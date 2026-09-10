import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentProfile } from '../../actions/profile';
import { getActiveConvoys, joinConvoyByCode } from '../../actions/convoy';
import { getMyStats } from '../../actions/stats';

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const auth = useSelector((state) => state.auth);
  const profileState = useSelector((state) => state.profile);
  const convoyState = useSelector((state) => state.convoy);
  const statsState = useSelector((state) => state.stats);

  const { user } = auth;
  const { profile, loading: profileLoading } = profileState;
  const { convoys, activeConvoy } = convoyState;
  const { myStats } = statsState;

  const [joinCodeInput, setJoinCodeInput] = useState('');

  useEffect(() => {
    dispatch(getCurrentProfile());
    dispatch(getActiveConvoys());
    dispatch(getMyStats());
  }, [dispatch]);

  const handleJoinByCode = (e) => {
    e.preventDefault();
    if (joinCodeInput.trim()) {
      dispatch(joinConvoyByCode(joinCodeInput.trim().toUpperCase(), navigate));
    }
  };

  const primaryVehicle = profile?.garage?.find((v) => v.is_primary) || profile?.garage?.[0];

  return (
    <div className="mobile-page-container">
      {/* Top Driver Header Profile Banner */}
      <div className="driver-hero-card">
        <div className="driver-hero-inner">
          <div className="driver-avatar-ring">
            <img
              src={user?.avatar || 'https://www.gravatar.com/avatar/?d=mp'}
              alt={user?.name}
              className="driver-avatar-img"
            />
            <div className="verified-badge" title="Verified Enthusiast">
              <i className="fa-solid fa-circle-check"></i>
            </div>
          </div>

          <div className="driver-identity-info">
            <div className="driver-callsign">
              {profile?.handle ? `@${profile.handle}` : user?.name}
            </div>
            <h1 className="driver-fullname">{user?.name}</h1>
            <div className="driver-tags">
              <span className="badge badge-cyan">
                <i className="fa-solid fa-gauge"></i> {profile?.driving_style || 'Spirited Driver'}
              </span>
              <span className="badge badge-purple">
                <i className="fa-solid fa-trophy"></i> {profile?.experience_level || 'Intermediate'}
              </span>
              {profile?.friend_code && (
                <span className="badge badge-cyan" title="Your unique friend code">
                  <i className="fa-solid fa-key"></i> {profile.friend_code}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Driver Stats Ribbon */}
        <div className="driver-metrics-ribbon">
          <div className="metric-cell">
            <span className="metric-label">Safety Score</span>
            <span className="metric-value highlight-emerald">
              {profile?.overall_safety_rating || 95}%
            </span>
          </div>
          <div className="metric-cell">
            <span className="metric-label">Total Distance</span>
            <span className="metric-value">
              {myStats?.summary?.total_distance_km || 0} <span className="unit">km</span>
            </span>
          </div>
          <div className="metric-cell">
            <span className="metric-label">Top Speed</span>
            <span className="metric-value highlight-cyan">
              {myStats?.summary?.max_speed_kph || 0} <span className="unit">km/h</span>
            </span>
          </div>
          <div className="metric-cell">
            <span className="metric-label">Convoys</span>
            <span className="metric-value">
              {profile?.total_convoys_completed || myStats?.summary?.total_drives || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Active Ride / Garage Card */}
      <div className="section-block">
        <div className="section-title-bar">
          <h3>
            <i className="fa-solid fa-car-side" style={{ color: 'var(--accent-cyan)' }}></i> Active Selected Ride
          </h3>
          <Link to="/garage" className="link-sm">
            Manage Garage ({profile?.garage?.length || 0}) &rarr;
          </Link>
        </div>

        {primaryVehicle ? (
          <div className="active-vehicle-card">
            <div className="vehicle-card-top">
              <div className="vehicle-icon-bubble">
                <i
                  className={`fa-solid ${
                    primaryVehicle.vehicle_type === 'Motorcycle' ? 'fa-motorcycle' : 'fa-car'
                  }`}
                ></i>
              </div>
              <div className="vehicle-primary-details">
                <div className="vehicle-type-label">{primaryVehicle.vehicle_type}</div>
                <h4 className="vehicle-name">
                  {primaryVehicle.year} {primaryVehicle.make} {primaryVehicle.model}
                </h4>
                <div className="vehicle-specs-pills">
                  {primaryVehicle.horsepower && (
                    <span className="spec-pill">{primaryVehicle.horsepower} HP</span>
                  )}
                  {primaryVehicle.color && (
                    <span className="spec-pill">{primaryVehicle.color}</span>
                  )}
                  <span className="spec-pill badge-primary-ride">Active Convoy Vehicle</span>
                </div>
              </div>
            </div>

            {primaryVehicle.modifications && primaryVehicle.modifications.length > 0 && (
              <div className="mods-chips-row">
                <span className="mods-label">Mods:</span>
                {primaryVehicle.modifications.map((m, idx) => (
                  <span key={idx} className="mod-chip">
                    {m}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="empty-garage-prompt">
            <div className="empty-icon">
              <i className="fa-solid fa-warehouse"></i>
            </div>
            <h4>Your garage is currently empty</h4>
            <p>Add your car or motorcycle to participate in real-time group drives</p>
            <Link to="/garage" className="btn btn-primary btn-sm">
              <i className="fa-solid fa-plus"></i> Park First Vehicle
            </Link>
          </div>
        )}
      </div>

      {/* Fast Convoy Actions */}
      <div className="section-block">
        <div className="section-title-bar">
          <h3>
            <i className="fa-solid fa-route" style={{ color: 'var(--accent-indigo)' }}></i> Convoy Hub
          </h3>
        </div>

        <div className="convoy-action-grid">
          {/* Join with 6-char code */}
          <div className="card join-code-card">
            <h4>Join with Drive Code</h4>
            <p>Enter the 6-character code given by your convoy lead</p>
            <form onSubmit={handleJoinByCode} className="join-code-form">
              <input
                type="text"
                className="form-input join-input"
                placeholder="e.g. TURBO7"
                maxLength={6}
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                required
              />
              <button type="submit" className="btn btn-primary">
                Join
              </button>
            </form>
          </div>

          {/* Launch new convoy */}
          <div className="card create-convoy-card">
            <h4>Create New Group Drive</h4>
            <p>Lead a convoy with live map tracking and walkie-talkie audio</p>
            <Link to="/create-convoy" className="btn btn-outline btn-block">
              <i className="fa-solid fa-plus"></i> Launch Convoy
            </Link>
          </div>
        </div>
      </div>

      {/* Active Convoys List */}
      <div className="section-block" style={{ marginBottom: '5rem' }}>
        <div className="section-title-bar">
          <h3>
            <i className="fa-solid fa-satellite-dish" style={{ color: 'var(--accent-emerald)' }}></i> Active Open Convoys
          </h3>
          <span className="badge badge-emerald">{convoys?.length || 0} Open</span>
        </div>

        {convoys && convoys.length > 0 ? (
          <div className="convoy-cards-list">
            {convoys.map((convoy) => (
              <div key={convoy._id} className="card convoy-summary-card">
                <div className="convoy-summary-header">
                  <div>
                    <h4 className="convoy-name-title">{convoy.name}</h4>
                    <div className="convoy-host-meta">
                      Lead: <strong>{convoy.host?.name || 'Driver'}</strong> &bull; Code:{' '}
                      <span className="join-code-badge">{convoy.join_code}</span>
                    </div>
                  </div>
                  <Link to={`/convoy/${convoy._id}`} className="btn btn-primary btn-sm">
                    Enter Map <i className="fa-solid fa-arrow-right"></i>
                  </Link>
                </div>

                <div className="convoy-summary-details">
                  {convoy.destination_name && (
                    <div className="destination-text">
                      <i className="fa-solid fa-flag-checkered"></i> Destination: {convoy.destination_name}
                    </div>
                  )}
                  <div className="participants-avatars-row">
                    <span className="count-label">
                      {convoy.participants?.length || 1} Drivers on Route:
                    </span>
                    <div className="avatar-overlap-group">
                      {convoy.participants?.slice(0, 5).map((p, idx) => (
                        <img
                          key={idx}
                          src={p.user?.avatar || 'https://www.gravatar.com/avatar/?d=mp'}
                          alt={p.user?.name || 'Driver'}
                          className="overlap-avatar"
                          title={p.user?.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center" style={{ padding: '2rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>No open convoys active right now.</p>
            <Link to="/create-convoy" className="btn btn-secondary btn-sm" style={{ marginTop: '0.5rem' }}>
              Create the First Convoy
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
