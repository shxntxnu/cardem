import React, { useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { reportHazard } from '../../actions/hazard';

const HAZARD_TYPES = [
  { id: 'police', label: 'Police Trap', icon: '👮', color: '#ff3860', desc: 'Patrol / Radar Speed Trap' },
  { id: 'instant_camera', label: 'Speed Camera', icon: '📸', color: '#ff793f', desc: 'Fixed Instant Speed Cam' },
  { id: 'average_camera', label: 'Avg Speed Zone', icon: '⏱️', color: '#ffb142', desc: 'Average Speed Check Zone' },
  { id: 'obstruction', label: 'Obstruction', icon: '🚧', color: '#f7b731', desc: 'Debris / Fallen Tree / Object' },
  { id: 'road_closure', label: 'Road Closed', icon: '⛔', color: '#eb4d4b', desc: 'Complete Road Block / Detour' },
  { id: 'lane_closure', label: 'Lane Closed', icon: '⚠️', color: '#f0932b', desc: 'Right/Left Lane Cones' },
  { id: 'traffic_density', label: 'Traffic Jam', icon: '🚗', color: '#e056fd', desc: 'Heavy Congestion / Standstill' },
  { id: 'traffic_lights', label: 'Traffic Lights', icon: '🚦', color: '#686de0', desc: 'Faulty Signal / Red Cam' }
];

const HazardReport = ({
  currentCoords,
  convoyId,
  reportHazard,
  onClose
}) => {
  const [selectedType, setSelectedType] = useState(null);
  const [description, setDescription] = useState('');
  const [speedLimit, setSpeedLimit] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (typeId) => {
    setIsSubmitting(true);

    let lat = currentCoords?.lat;
    let lng = currentCoords?.lng;

    // Fallback to fresh geolocation if not provided via props
    if (!lat || !lng) {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch (err) {
        // Fallback default coordinates if GPS unavailable
        lat = 51.5074;
        lng = -0.1278;
      }
    }

    const payload = {
      alert_type: typeId || selectedType,
      title: HAZARD_TYPES.find((h) => h.id === (typeId || selectedType))?.label,
      description: description || undefined,
      speed_limit: speedLimit ? Number(speedLimit) : undefined,
      location: {
        type: 'Point',
        coordinates: [Number(lng), Number(lat)]
      },
      convoy_id: convoyId || undefined
    };

    await reportHazard(payload, convoyId);
    setIsSubmitting(false);
    if (onClose) onClose();
  };

  return (
    <div className="hazard-modal-overlay">
      <div className="hud-card hazard-report-drawer animate-slide-up">
        <div className="hazard-drawer-header">
          <div>
            <h2>🚨 Report Road Hazard</h2>
            <p className="subtitle">Instant 1-Tap alert for all convoy drivers & nearby enthusiasts</p>
          </div>
          {onClose && (
            <button className="btn-close" onClick={onClose}>✕</button>
          )}
        </div>

        {/* 1-Tap Quick Hazard Grid */}
        <div className="hazard-type-grid">
          {HAZARD_TYPES.map((hazard) => (
            <button
              key={hazard.id}
              type="button"
              className={`hazard-quick-btn ${selectedType === hazard.id ? 'is-selected' : ''}`}
              style={{ '--accent-color': hazard.color }}
              onClick={() => {
                setSelectedType(hazard.id);
                // Instant one-tap submit for high-speed cockpit usage if no extra fields needed
                if (!description && !speedLimit) {
                  handleSubmit(hazard.id);
                }
              }}
              disabled={isSubmitting}
            >
              <span className="hazard-icon">{hazard.icon}</span>
              <span className="hazard-label">{hazard.label}</span>
              <span className="hazard-desc">{hazard.desc}</span>
            </button>
          ))}
        </div>

        {/* Optional details toggle / quick fields */}
        {selectedType && (
          <div className="hazard-extra-details animate-fade-in mt-4">
            <div className="form-group-row">
              <div className="form-group">
                <label>Speed Limit (if camera)</label>
                <input
                  type="number"
                  placeholder="e.g. 50"
                  value={speedLimit}
                  onChange={(e) => setSpeedLimit(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Notes / Lane</label>
                <input
                  type="text"
                  placeholder="e.g. In unmarked silver van"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div className="hazard-submit-row mt-3">
              <button
                className="btn btn-primary btn-glow w-full"
                onClick={() => handleSubmit(selectedType)}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Broadcasting Alert...' : '🚀 Broadcast Alert to Drivers'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

HazardReport.propTypes = {
  currentCoords: PropTypes.object,
  convoyId: PropTypes.string,
  reportHazard: PropTypes.func.isRequired,
  onClose: PropTypes.func
};

export default connect(null, { reportHazard })(HazardReport);
