import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { getRecentAlerts, confirmHazardAlert, dismissHazardAlert } from '../../actions/hazard';
import HazardReport from './HazardReport';

const HAZARD_ICONS = {
  police: '👮',
  instant_camera: '📸',
  average_camera: '⏱️',
  obstruction: '🚧',
  road_closure: '⛔',
  lane_closure: '⚠️',
  traffic_density: '🚗',
  traffic_lights: '🚦'
};

const AlertsFeed = ({
  getRecentAlerts,
  confirmHazardAlert,
  dismissHazardAlert,
  hazard: { alerts, loading }
}) => {
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    getRecentAlerts();
    const interval = setInterval(() => {
      getRecentAlerts();
    }, 15000); // refresh every 15s

    return () => clearInterval(interval);
  }, [getRecentAlerts]);

  return (
    <div className="alerts-feed-container animate-fade-in">
      <div className="alerts-header">
        <div>
          <h1 className="page-title">
            <span className="text-gradient">Road Hazards & Cameras</span> ⚠️
          </h1>
          <p className="subtitle">
            Crowdsourced real-time intelligence on speed traps, cameras, closures, and congestion.
          </p>
        </div>
        <button
          className="btn btn-danger btn-glow"
          onClick={() => setShowReportModal(true)}
        >
          🚨 Report Hazard
        </button>
      </div>

      {showReportModal && (
        <HazardReport onClose={() => setShowReportModal(false)} />
      )}

      {loading && alerts.length === 0 ? (
        <div className="hud-card loading-card">
          <div className="loading-spinner"></div>
          <p>Scanning regional telemetry nodes...</p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="hud-card empty-state">
          <div className="empty-icon">🟢</div>
          <h3>Roads are Clear Ahead!</h3>
          <p>No active police traps, cameras, or closures reported recently in this sector.</p>
        </div>
      ) : (
        <div className="alerts-list">
          {alerts.map((alert) => {
            const icon = HAZARD_ICONS[alert.alert_type] || '⚠️';
            const formattedType = alert.alert_type.replace(/_/g, ' ').toUpperCase();
            const timeAgo = Math.round((Date.now() - new Date(alert.created_at).getTime()) / 60000);

            return (
              <div key={alert._id} className="hud-card alert-card animate-fade-in">
                <div className="alert-card-header">
                  <div className="alert-type-badge">
                    <span className="alert-icon">{icon}</span>
                    <div>
                      <span className="alert-category">{formattedType}</span>
                      <h3 className="alert-title">{alert.title || formattedType}</h3>
                    </div>
                  </div>
                  <span className="alert-time">
                    {timeAgo <= 0 ? 'Just now' : `${timeAgo}m ago`}
                  </span>
                </div>

                {alert.description && (
                  <p className="alert-description">{alert.description}</p>
                )}

                <div className="alert-meta-row">
                  {alert.speed_limit && (
                    <span className="speed-limit-badge">
                      Speed Limit: {alert.speed_limit}
                    </span>
                  )}
                  <span className="confirmations-badge">
                    👍 {alert.confirmations?.length || 0} Confirmed
                  </span>
                  {alert.reported_by && alert.reported_by.name && (
                    <span className="reporter-badge">
                      Reported by: {alert.reported_by.name}
                    </span>
                  )}
                </div>

                <div className="alert-actions-row">
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => confirmHazardAlert(alert._id)}
                  >
                    👍 Still There
                  </button>
                  <button
                    className="btn btn-secondary-ghost btn-sm"
                    onClick={() => dismissHazardAlert(alert._id)}
                  >
                    ✕ Cleared
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

AlertsFeed.propTypes = {
  getRecentAlerts: PropTypes.func.isRequired,
  confirmHazardAlert: PropTypes.func.isRequired,
  dismissHazardAlert: PropTypes.func.isRequired,
  hazard: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  hazard: state.hazard
});

export default connect(mapStateToProps, {
  getRecentAlerts,
  confirmHazardAlert,
  dismissHazardAlert
})(AlertsFeed);
