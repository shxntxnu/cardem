import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { getConvoy, leaveConvoy, updateConvoyStatus } from '../../actions/convoy';
import socketService from '../../utils/socketService';

const ConvoyLobby = ({
  getConvoy,
  leaveConvoy,
  updateConvoyStatus,
  convoy: { convoy, loading },
  auth: { user }
}) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getConvoy(id);

    // Join Socket room for real-time lobby updates
    if (user && user._id) {
      socketService.joinConvoy(id, {
        _id: user._id,
        name: user.name,
        avatar: user.avatar
      });
    }

    return () => {
      // socket room cleanup handled by explicit leave or navigation
    };
  }, [getConvoy, id, user]);

  if (loading || !convoy) {
    return (
      <div className="lobby-container">
        <div className="hud-card loading-card">
          <div className="loading-spinner"></div>
          <p>Connecting to Convoy Telemetry Node...</p>
        </div>
      </div>
    );
  }

  const isHost = user && convoy.host && (convoy.host._id === user._id || convoy.host === user._id);
  const participants = convoy.participants || [];

  const copyCode = () => {
    if (convoy.join_code) {
      navigator.clipboard.writeText(convoy.join_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartDrive = () => {
    updateConvoyStatus(id, 'in_progress');
    navigate(`/convoy/${id}/drive`);
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
          <span className={`status-tag status-${convoy.status}`}>
            ● {convoy.status.toUpperCase().replace('_', ' ')}
          </span>
          <span className="radio-tag">
            📻 Walkie Channel: <strong>{convoy.radio_channel || 'General'}</strong>
          </span>
        </div>

        <h1 className="lobby-title">{convoy.name}</h1>
        {convoy.description && <p className="lobby-desc">{convoy.description}</p>}

        {/* Join Code Callout */}
        <div className="join-code-banner">
          <span className="join-code-label">SHARE CODE TO INVITE DRIVERS</span>
          <div className="code-display" onClick={copyCode} title="Click to copy">
            <span className="code-text">{convoy.join_code}</span>
            <button className="copy-btn">{copied ? '✓ COPIED' : '📋 COPY'}</button>
          </div>
        </div>

        {/* Destination & Route Specs */}
        {convoy.destination && convoy.destination.name && (
          <div className="destination-badge">
            <span className="dest-icon">📍 Destination:</span>
            <span className="dest-name">{convoy.destination.name}</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="lobby-actions">
          <Link to={`/convoy/${id}/drive`} className="btn btn-primary btn-glow btn-lg">
            🛰️ ENTER LIVE MAP HUD
          </Link>

          {isHost && convoy.status === 'forming' && (
            <button className="btn btn-success btn-lg" onClick={handleStartDrive}>
              🟢 START CONVOY DRIVE
            </button>
          )}

          {isHost && convoy.status === 'in_progress' && (
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
          <h2>Convoy Roster ({participants.length}/{convoy.max_participants})</h2>
          <span className="live-indicator">LIVE TELEMETRY ACTIVE</span>
        </div>

        <div className="roster-grid">
          {participants.map((p, idx) => {
            const driver = p.user;
            const vehicle = p.vehicle;
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
                  {driver?._id === convoy.host?._id && (
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
