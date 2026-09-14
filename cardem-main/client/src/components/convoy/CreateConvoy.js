import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { createConvoy } from '../../actions/convoy';
import DestinationSearch from '../navigation/DestinationSearch';

const CreateConvoy = ({ createConvoy }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const prefilledDest = location.state?.destination;

  const [formData, setFormData] = useState({
    name: prefilledDest ? `Drive to ${prefilledDest.name}` : '',
    description: '',
    destination_name: prefilledDest?.name || '',
    destination_lat: prefilledDest?.lat !== undefined ? String(prefilledDest.lat) : '',
    destination_lng: prefilledDest?.lng !== undefined ? String(prefilledDest.lng) : '',
    max_participants: 20,
    radio_channel: 'convoy-main',
    is_private: false
  });

  const [waypoints, setWaypoints] = useState(
    prefilledDest
      ? [
          {
            name: prefilledDest.name,
            display_name: prefilledDest.display_name || prefilledDest.name,
            lat: prefilledDest.lat,
            lng: prefilledDest.lng,
            order: 1
          }
        ]
      : []
  );

  const {
    name,
    description,
    destination_name,
    destination_lat,
    destination_lng,
    max_participants,
    radio_channel,
    is_private
  } = formData;

  const handleAddStop = (place) => {
    if (!place || place.lat === undefined || place.lng === undefined) return;
    const newStop = {
      name: place.name || 'Waypoint',
      display_name: place.display_name || place.name || '',
      lat: place.lat,
      lng: place.lng,
      order: waypoints.length + 1
    };

    setWaypoints((prev) => [...prev, newStop]);
    if (!destination_name) {
      setFormData((prev) => ({
        ...prev,
        destination_name: place.name,
        destination_lat: String(place.lat),
        destination_lng: String(place.lng)
      }));
    }
  };

  const handleRemoveStop = (index) => {
    setWaypoints((prev) => prev.filter((_, i) => i !== index));
  };

  const onChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const onSubmit = (e) => {
    e.preventDefault();

    const targetDest = waypoints.length > 0 ? waypoints[waypoints.length - 1] : null;
    const finalDestName = targetDest?.name || destination_name;
    const finalCoords = targetDest
      ? { lat: targetDest.lat, lng: targetDest.lng }
      : destination_lat && destination_lng
      ? { lat: Number(destination_lat), lng: Number(destination_lng) }
      : null;

    const payload = {
      name,
      description,
      max_participants: Number(max_participants),
      radio_channel,
      is_private,
      destination_name: finalDestName,
      destination_coordinates: finalCoords,
      waypoints: waypoints.map((w, idx) => ({
        name: w.name,
        display_name: w.display_name || w.name,
        lat: w.lat,
        lng: w.lng,
        order: idx + 1
      }))
    };

    createConvoy(payload, navigate);
  };

  return (
    <div className="convoy-form-container animate-fade-in">
      <div className="hud-card max-w-xl mx-auto">
        <div className="card-header">
          <h1 className="text-xl font-bold">
            <span className="text-gradient">Assemble Convoy</span> 🏁
          </h1>
          <p className="subtitle">
            Create a live group drive session with real-time GPS tracking and Walkie-Talkie radio.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="form-group">
            <label>Convoy Callout / Name *</label>
            <input
              type="text"
              name="name"
              value={name}
              onChange={onChange}
              placeholder="e.g. Sunday Alpine Mountain Run"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label>Drive Briefing / Description</label>
            <textarea
              name="description"
              value={description}
              onChange={onChange}
              rows="3"
              placeholder="Pace guidelines, meetup points, fuel stops..."
              className="form-input"
            />
          </div>

          {/* Planned Stops & Destination Search */}
          <div className="form-group">
            <label>Planned Destinations & Stops (Search to add)</label>
            <DestinationSearch
              onSelectDestination={handleAddStop}
              onAddWaypoint={handleAddStop}
              isConvoyActive={false}
            />

            {/* List of Locations before creating/accepting convoy */}
            {waypoints.length > 0 && (
              <div className="create-waypoints-list mt-3">
                <span className="text-xs font-bold text-cyan uppercase tracking-wider mb-2 block">
                  Chosen Sequence ({waypoints.length} {waypoints.length === 1 ? 'Stop' : 'Stops'}):
                </span>
                <div className="waypoints-sequence-list">
                  {waypoints.map((wp, idx) => {
                    const isFinal = idx === waypoints.length - 1;
                    return (
                      <div key={idx} className={`waypoint-sequence-item ${isFinal ? 'is-final-item' : ''}`}>
                        <div className="waypoint-num-badge">
                          {isFinal && waypoints.length > 1 ? '🏁' : idx + 1}
                        </div>
                        <div className="waypoint-meta">
                          <strong className="wp-name">{wp.name}</strong>
                          {wp.display_name && <span className="wp-sub">{wp.display_name}</span>}
                        </div>
                        <button
                          type="button"
                          className="btn-wp-remove"
                          onClick={() => handleRemoveStop(idx)}
                          title="Remove stop"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="form-group-row">
            <div className="form-group">
              <label>Final Destination Landmark (optional)</label>
              <input
                type="text"
                name="destination_name"
                value={destination_name}
                onChange={onChange}
                placeholder="e.g. Silverstone Circuit, Cafe Lookout"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Max Vehicles</label>
              <input
                type="number"
                name="max_participants"
                value={max_participants}
                onChange={onChange}
                min="2"
                max="100"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group-row">
            <div className="form-group">
              <label>Walkie-Talkie Radio Channel</label>
              <input
                type="text"
                name="radio_channel"
                value={radio_channel}
                onChange={onChange}
                placeholder="channel name"
                className="form-input"
              />
            </div>
            <div className="form-group-checkbox flex-end">
              <label>
                <input
                  type="checkbox"
                  name="is_private"
                  checked={is_private}
                  onChange={onChange}
                />
                <span> Private (Invite Code Only)</span>
              </label>
            </div>
          </div>

          <div className="form-actions mt-6">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-glow">
              Launch Convoy Session 🚀
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

CreateConvoy.propTypes = {
  createConvoy: PropTypes.func.isRequired
};

export default connect(null, { createConvoy })(CreateConvoy);
