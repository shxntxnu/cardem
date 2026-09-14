import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { getConvoy, leaveConvoy, updateConvoyStatus } from '../../actions/convoy';
import socketService from '../../utils/socketService';

const ConvoyLobby = ({
  getConvoy,
  leaveConvoy,
  updateConvoyStatus,
  convoy: { activeConvoy, convoy, loading, error },
  auth: { user }
}) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const currentConvoy = convoy || activeConvoy;

  useEffect(() => {
    getConvoy(id);

    // Join Socket room for real-time lobby updates
    const userId = user?._id || user?.id;
    if (userId) {
      socketService.joinConvoy(id, {
        _id: userId,
        name: user.name,
        avatar: user.avatar
      });
    }

    return () => {
      // socket room cleanup handled by explicit leave or navigation
    };
  }, [getConvoy, id, user]);

  if (!loading && !currentConvoy) {
    return (
      <div className="lobby-container animate-fade-in">
        <div className="hud-card loading-card">
          <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '2.5rem', color: '#ff4757', marginBottom: '1rem' }}></i>
          <h2>Convoy Unavailable</h2>
          <p>{error?.msg || 'Could not connect to this convoy. It may have ended or the link is invalid.'}</p>
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={() => getConvoy(id)}>
              Retry Connection
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/convoys')}>
              Back to Convoys
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !currentConvoy) {
    return (
      <div className="lobby-container">
        <div className="hud-card loading-card">
          <div className="loading-spinner"></div>
          <p>Connecting to Convoy Telemetry Node...</p>
        </div>
      </div>
    );
  }

  const currentUserId = (user?._id || user?.id)?.toString();
  const hostId = (currentConvoy.host?._id || currentConvoy.host?.id || currentConvoy.host)?.toString();
  const isHost = Boolean(currentUserId && hostId && currentUserId === hostId);
  const participants = currentConvoy.participants || [];
  const destinationName = currentConvoy.destination_name || currentConvoy.destination?.name;

  const copyCode = () => {
    if (currentConvoy.join_code) {
      navigator.clipboard.writeText(currentConvoy.join_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartDrive = (autoStart = false) => {
    updateConvoyStatus(id, 'active');
    navigate(`/convoy/${id}/drive`, {
      state: { autoStartNav: autoStart, returnTo: `/convoy/${id}` }
    });
  };

  const handleEndDrive = () => {
    updateConvoyStatus(id, 'completed');
  };

  const handleLeave = () => {
    leaveConvoy(id, navigate);
  };

  return (
    <div className="lobby-container animate-fade-in">
      {/* Convoy Hero Card */}
      <div className="hud-card lobby-header-card">
        <div className="lobby-status-bar">
          <span className={`status-tag status-${currentConvoy.status || 'active'}`}>
            ● {(currentConvoy.status || 'active').toUpperCase().replace('_', ' ')}
          </span>
          <span className="radio-tag">
            📻 Walkie Channel: <strong>{currentConvoy.radio_channel || 'General'}</strong>
          </span>
        </div>

        <h1 className="lobby-title">{currentConvoy.name}</h1>
        {currentConvoy.description && <p className="lobby-desc">{currentConvoy.description}</p>}

        {/* Join Code Callout */}
        <div className="join-code-banner">
          <span className="join-code-label">SHARE CODE TO INVITE DRIVERS</span>
          <div className="code-display" onClick={copyCode} title="Click to copy">
            <span className="code-text">{currentConvoy.join_code}</span>
            <button className="copy-btn">{copied ? '✓ COPIED' : '📋 COPY'}</button>
          </div>
        </div>

        {/* Convoy Route Itinerary & Planned Stops List before accepting route */}
        <div className="lobby-route-section">
          <div className="lobby-route-header-strip">
            <div className="planner-title-group">
              <span className="badge-corridor">🗺️ CONVOY ROUTE ITINERARY</span>
              <span className="stops-count-tag">
                {currentConvoy.waypoints?.length > 0
                  ? `${currentConvoy.waypoints.length} ${currentConvoy.waypoints.length === 1 ? 'Stop' : 'Stops'}`
                  : destinationName
                  ? '1 Stop'
                  : '0 Stops'}
              </span>
            </div>
            <span className={`badge-role ${currentConvoy.is_route_finalised ? 'role-finalised' : 'role-host'}`}>
              {currentConvoy.is_route_finalised ? '✅ Sequence Finalised' : '⏳ Sequence In Planning'}
            </span>
          </div>

          {currentConvoy.waypoints && currentConvoy.waypoints.length > 0 ? (
            <div className="lobby-waypoints-list">
              {currentConvoy.waypoints.map((wp, idx) => {
                const isFinal = idx === currentConvoy.waypoints.length - 1;
                return (
                  <div key={wp._id || wp.id || idx} className={`lobby-waypoint-item ${isFinal ? 'is-final-item' : ''}`}>
                    <div className="waypoint-num-badge">
                      {isFinal && currentConvoy.waypoints.length > 1 ? '🏁' : idx + 1}
                    </div>
                    <div className="waypoint-meta">
                      <strong className="wp-name">{wp.name}</strong>
                      {wp.display_name && <span className="wp-sub">{wp.display_name}</span>}
                    </div>
                    <span className="waypoint-step-tag">
                      {idx === 0 ? '🏁 Stop 1 (Start)' : isFinal ? '🏆 Final Destination' : `📍 Stop ${idx + 1}`}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : destinationName ? (
            <div className="lobby-waypoints-list">
              <div className="lobby-waypoint-item is-final-item">
                <div className="waypoint-num-badge">🏁</div>
                <div className="waypoint-meta">
                  <strong className="wp-name">{destinationName}</strong>
                  <span className="wp-sub">Designated Convoy Destination</span>
                </div>
                <span className="waypoint-step-tag">🏆 Final Destination</span>
              </div>
            </div>
          ) : (
            <div className="empty-itinerary-banner">
              <span>📍 No route stops configured yet. The host can choose destinations on the live map.</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="lobby-actions">
          {currentConvoy.waypoints?.length > 0 || destinationName ? (
            <>
              <button
                className="btn btn-primary btn-glow btn-lg btn-accept-route"
                onClick={() => handleStartDrive(true)}
                id="btn-accept-route-nav"
              >
                🚀 ACCEPT ROUTE & BEGIN NAVIGATION
              </button>
              <button
                className="btn btn-secondary-ghost"
                onClick={() => handleStartDrive(false)}
              >
                🛰️ View Map Only
              </button>
            </>
          ) : (
            <button
              className="btn btn-primary btn-glow btn-lg"
              onClick={() => handleStartDrive(false)}
            >
              🛰️ {isHost ? 'ENTER MAP TO SET ROUTE' : 'ENTER LIVE MAP HUD'}
            </button>
          )}

          {isHost && currentConvoy.status !== 'completed' && (
            <button className="btn btn-warning" onClick={handleEndDrive}>
              🏁 COMPLETE DRIVE SESSION
            </button>
          )}

          <button className="btn btn-danger-ghost" onClick={handleLeave}>
            Leave Convoy
          </button>
        </div>
      </div>

      {/* Participant Fleet Roster */}
      <div className="roster-section mt-6">
        <div className="roster-header">
          <h2>Convoy Roster ({participants.length}/{currentConvoy.max_participants || 20})</h2>
          <span className="live-indicator">LIVE TELEMETRY ACTIVE</span>
        </div>

        <div className="roster-grid">
          {participants.map((p, idx) => {
            const driver = p.user;
            const vehicle = p.vehicle;
            const isParticipantHost = hostId && (driver?._id || driver?.id || driver)?.toString() === hostId;
            return (
              <div key={idx} className="participant-card hud-card">
                <div className="participant-avatar-wrap">
                  {driver?.avatar ? (
                    <img src={driver.avatar} alt={driver.name} className="participant-avatar" />
                  ) : (
                    <div className="participant-avatar placeholder-avatar">
                      {driver?.name ? driver.name[0].toUpperCase() : 'D'}
                    </div>
                  )}
                  {isParticipantHost && (
                    <span className="host-badge" title="Convoy Host">👑</span>
                  )}
                </div>

                <div className="participant-details">
                  <div className="driver-name-row">
                    <span className="driver-name">{driver?.name || 'Driver'}</span>
                    <span className="driver-status">
                      {p.is_online !== false ? '🟢 Ready' : '⚪ Standby'}
                    </span>
                  </div>

                  {vehicle ? (
                    <div className="driver-vehicle">
                      <span className="vehicle-icon">
                        {vehicle.type === 'motorcycle' ? '🏍️' : '🏎️'}
                      </span>
                      <span className="vehicle-name">
                        {vehicle.year ? `${vehicle.year} ` : ''}{vehicle.make} {vehicle.model}
                      </span>
                    </div>
                  ) : (
                    <div className="driver-vehicle text-dim">
                      <span>🏎️ Enthusiast Machine</span>
                    </div>
                  )}

                  {p.last_telemetry && p.last_telemetry.speed !== undefined && (
                    <div className="driver-telemetry-badge">
                      Speed: {Math.round(p.last_telemetry.speed * 3.6)} km/h
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

ConvoyLobby.propTypes = {
  getConvoy: PropTypes.func.isRequired,
  leaveConvoy: PropTypes.func.isRequired,
  updateConvoyStatus: PropTypes.func.isRequired,
  convoy: PropTypes.object.isRequired,
  auth: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  convoy: state.convoy,
  auth: state.auth
});

export default connect(mapStateToProps, {
  getConvoy,
  leaveConvoy,
  updateConvoyStatus
})(ConvoyLobby);
