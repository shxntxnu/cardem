import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addRoadmapItem, deleteRoadmapItem } from '../../actions/projectActions';
import { setAlert } from '../../actions/alertActions';

const RoadmapStudio = () => {
  const dispatch = useDispatch();
  const roadmap = useSelector(
    (state) => state.project.currentProject.roadmap || []
  );

  const [showModal, setShowModal] = useState(false);
  const [newItem, setNewItem] = useState({
    horizon: 'Horizon 1 (0-3 Months)',
    title: '',
    impact: 'High',
    status: 'Planned',
    desc: ''
  });

  const handleSaveItem = (e) => {
    e.preventDefault();
    if (!newItem.title || !newItem.desc) return;

    dispatch(
      addRoadmapItem({
        id: 'r_' + Date.now(),
        ...newItem
      })
    );

    setNewItem({
      horizon: 'Horizon 1 (0-3 Months)',
      title: '',
      impact: 'High',
      status: 'Planned',
      desc: ''
    });
    setShowModal(false);
    dispatch(setAlert('Roadmap initiative added', 'success'));
  };

  const getImpactBadge = (impact) => {
    switch (impact) {
      case 'Critical':
        return 'badge-rose';
      case 'High':
        return 'badge-amber';
      case 'Medium':
        return 'badge-cyan';
      default:
        return 'badge-purple';
    }
  };

  const horizons = [
    'Horizon 1 (0-3 Months)',
    'Horizon 2 (3-6 Months)',
    'Horizon 3 (6-12 Months)'
  ];

  return (
    <div className="tab-content">
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <i className="fa-solid fa-road" style={{ color: 'var(--accent-amber)' }}></i>
            Further Work & Architectural Roadmap
          </h2>
          <p className="section-desc">
            Strategic post-launch milestones, technical debt remediation, and enterprise scaling horizons.
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
          <i className="fa-solid fa-plus"></i>
          Add Initiative
        </button>
      </div>

      {/* Horizons Matrix */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {horizons.map((hz) => {
          const items = roadmap.filter((r) => r.horizon === hz);
          return (
            <div key={hz} className="card">
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-flag-checkered" style={{ color: 'var(--accent-cyan)' }}></i>
                  <h3 className="card-title">{hz}</h3>
                </div>
                <span className="badge badge-cyan">{items.length} Initiatives</span>
              </div>

              {items.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                  No initiatives defined for this horizon yet.
                </p>
              ) : (
                <div className="grid-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.75rem'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className={`badge ${getImpactBadge(item.impact)}`}>
                            {item.impact} Impact
                          </span>
                          <button
                            className="btn btn-danger btn-sm"
                            style={{ padding: '0.2rem 0.4rem' }}
                            onClick={() => dispatch(deleteRoadmapItem(item.id))}
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                        <h4 style={{ fontSize: '1rem', fontWeight: '600', marginTop: '0.5rem', color: 'var(--text-main)' }}>
                          {item.title}
                        </h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          {item.desc}
                        </p>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <span className="badge badge-emerald">{item.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Roadmap Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Define Architectural Initiative</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleSaveItem}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Roadmap Horizon</label>
                  <select
                    className="form-select"
                    value={newItem.horizon}
                    onChange={(e) => setNewItem({ ...newItem, horizon: e.target.value })}
                  >
                    <option value="Horizon 1 (0-3 Months)">Horizon 1 (0-3 Months - Hardening)</option>
                    <option value="Horizon 2 (3-6 Months)">Horizon 2 (3-6 Months - Scale & Realtime)</option>
                    <option value="Horizon 3 (6-12 Months)">Horizon 3 (6-12 Months - Microservices & AI)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Initiative Title</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Distributed Redis Cache Layer"
                    value={newItem.title}
                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Architectural Impact</label>
                  <select
                    className="form-select"
                    value={newItem.impact}
                    onChange={(e) => setNewItem({ ...newItem, impact: e.target.value })}
                  >
                    <option value="Critical">Critical (P0)</option>
                    <option value="High">High (P1)</option>
                    <option value="Medium">Medium (P2)</option>
                    <option value="Low">Low (P3)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Description & Implementation Scope</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Describe problem, architectural strategy, and scaling rationale..."
                    value={newItem.desc}
                    onChange={(e) => setNewItem({ ...newItem, desc: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Initiative
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoadmapStudio;
