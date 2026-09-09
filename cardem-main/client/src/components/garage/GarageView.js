import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { getCurrentProfile, addVehicle, setPrimaryVehicle, deleteVehicle } from '../../actions/profile';

const GarageView = ({
  getCurrentProfile,
  addVehicle,
  setPrimaryVehicle,
  deleteVehicle,
  profile: { profile, loading }
}) => {
  useEffect(() => {
    getCurrentProfile();
  }, [getCurrentProfile]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'car',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    nickname: '',
    color: '',
    horsepower: '',
    is_primary: false,
    mods: ''
  });

  const { type, make, model, year, nickname, color, horsepower, is_primary, mods } = formData;

  const onChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      year: Number(year),
      horsepower: horsepower ? Number(horsepower) : undefined,
      mods: typeof mods === 'string' ? mods.split(',').map((m) => m.trim()).filter(Boolean) : mods
    };
    addVehicle(payload);
    setShowAddModal(false);
    setFormData({
      type: 'car',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      nickname: '',
      color: '',
      horsepower: '',
      is_primary: false,
      mods: ''
    });
  };

  const garage = profile?.garage || [];
  const primaryVehicle = garage.find((v) => v.is_primary);

  return (
    <div className="garage-container animate-fade-in">
      <div className="garage-header">
        <div>
          <h1 className="page-title">
            <span className="text-gradient">Enthusiast Garage</span> 🏎️
          </h1>
          <p className="subtitle">
            Manage your rides, tune your specifications, and choose your active machine for convoys.
          </p>
        </div>
        <button
          className="btn btn-primary btn-glow"
          onClick={() => setShowAddModal(!showAddModal)}
        >
          {showAddModal ? '✕ Cancel' : '+ Park New Ride'}
        </button>
      </div>

      {/* Add Vehicle Modal / Inline Drawer */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="hud-card modal-content">
            <div className="modal-header">
              <h2>Add Machine to Garage</h2>
              <button className="btn-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={onSubmit} className="garage-form">
              <div className="form-group-row">
                <div className="form-group">
                  <label>Vehicle Category</label>
                  <select name="type" value={type} onChange={onChange} className="form-input">
                    <option value="car">🚗 Car / Sports Car / Supercar</option>
                    <option value="motorcycle">🏍️ Motorcycle / Superbike</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Nickname / Callout</label>
                  <input
                    type="text"
                    name="nickname"
                    value={nickname}
                    onChange={onChange}
                    placeholder="e.g. Midnight Ghost"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label>Make *</label>
                  <input
                    type="text"
                    name="make"
                    value={make}
                    onChange={onChange}
                    placeholder="e.g. Porsche, Ducati, BMW"
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Model *</label>
                  <input
                    type="text"
                    name="model"
                    value={model}
                    onChange={onChange}
                    placeholder="e.g. 911 GT3 RS, Panigale V4"
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label>Year</label>
                  <input
                    type="number"
                    name="year"
                    value={year}
                    onChange={onChange}
                    className="form-input"
                    min="1950"
                    max="2030"
                  />
                </div>
                <div className="form-group">
                  <label>Horsepower (HP)</label>
                  <input
                    type="number"
                    name="horsepower"
                    value={horsepower}
                    onChange={onChange}
                    placeholder="e.g. 520"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Body Color</label>
                  <input
                    type="text"
                    name="color"
                    value={color}
                    onChange={onChange}
                    placeholder="e.g. Shark Blue"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Modifications & Upgrades (comma separated)</label>
                <input
                  type="text"
                  name="mods"
                  value={mods}
                  onChange={onChange}
                  placeholder="e.g. Akrapovic titanium exhaust, Stage 2 tune, Michelin Cup 2 tyres"
                  className="form-input"
                />
              </div>

              <div className="form-group-checkbox">
                <label>
                  <input
                    type="checkbox"
                    name="is_primary"
                    checked={is_primary}
                    onChange={onChange}
                  />
                  <span> Set as Primary Convoy Ride</span>
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save to Garage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Primary Ride Spotlight */}
      {primaryVehicle && (
        <div className="primary-ride-banner hud-card">
          <div className="ride-badge">Active Convoy Ride</div>
          <div className="ride-content">
            <div className="ride-icon">
              {primaryVehicle.type === 'motorcycle' ? '🏍️' : '🏎️'}
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
                <span className="spec-pill">🏷️ {primaryVehicle.type.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Garage Grid */}
      <h2 className="section-title">Vehicles in Fleet ({garage.length})</h2>
      {loading ? (
        <div className="loading-spinner">Loading garage...</div>
      ) : garage.length === 0 ? (
        <div className="hud-card empty-state">
          <div className="empty-icon">🏁</div>
          <h3>Your garage is currently empty</h3>
          <p>Park your first sports car or bike to broadcast your ride in live group convoys.</p>
          <button className="btn btn-primary mt-3" onClick={() => setShowAddModal(true)}>
            Add Vehicle
          </button>
        </div>
      ) : (
        <div className="garage-grid">
          {garage.map((vehicle) => (
            <div
              key={vehicle._id}
              className={`vehicle-card hud-card ${vehicle.is_primary ? 'is-active' : ''}`}
            >
              <div className="vehicle-card-top">
                <span className="vehicle-type-icon">
                  {vehicle.type === 'motorcycle' ? '🏍️' : '🏎️'}
                </span>
                {vehicle.is_primary ? (
                  <span className="badge badge-success">ACTIVE RIDE</span>
                ) : (
                  <button
                    className="btn btn-xs btn-outline"
                    onClick={() => setPrimaryVehicle(vehicle._id)}
                  >
                    Set Primary
                  </button>
                )}
              </div>

              <div className="vehicle-card-body">
                <h3>{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                {vehicle.nickname && <p className="text-dim">"{vehicle.nickname}"</p>}

                <div className="specs-list">
                  <div className="spec-item">
                    <span className="spec-label">Power</span>
                    <span className="spec-val">{vehicle.horsepower ? `${vehicle.horsepower} HP` : 'Stock'}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Color</span>
                    <span className="spec-val">{vehicle.color || 'Custom'}</span>
                  </div>
                </div>

                {vehicle.mods && vehicle.mods.length > 0 && (
                  <div className="mods-container">
                    <span className="mods-title">Modifications:</span>
                    <div className="mods-tags">
                      {vehicle.mods.map((mod, idx) => (
                        <span key={idx} className="mod-tag">{mod}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="vehicle-card-actions">
                <button
                  className="btn btn-danger-ghost btn-sm"
                  onClick={() => deleteVehicle(vehicle._id)}
                  title="Remove from garage"
                >
                  🗑️ Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

GarageView.propTypes = {
  getCurrentProfile: PropTypes.func.isRequired,
  addVehicle: PropTypes.func.isRequired,
  setPrimaryVehicle: PropTypes.func.isRequired,
  deleteVehicle: PropTypes.func.isRequired,
  profile: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  profile: state.profile
});

export default connect(mapStateToProps, {
  getCurrentProfile,
  addVehicle,
  setPrimaryVehicle,
  deleteVehicle
})(GarageView);
