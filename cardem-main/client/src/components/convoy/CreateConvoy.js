import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { createConvoy } from '../../actions/convoy';

const CreateConvoy = ({ createConvoy }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    destination_name: '',
    destination_lat: '',
    destination_lng: '',
    max_participants: 20,
    radio_channel: 'convoy-main',
    is_private: false
  });

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

  const onChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name,
      description,
      max_participants: Number(max_participants),
      radio_channel,
      is_private,
      destination: destination_name
        ? {
            name: destination_name,
            coordinates: [
              destination_lng ? Number(destination_lng) : -0.1278,
              destination_lat ? Number(destination_lat) : 51.5074
            ]
          }
        : undefined
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

          <div className="form-group-row">
            <div className="form-group">
              <label>Destination Landmark</label>
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
