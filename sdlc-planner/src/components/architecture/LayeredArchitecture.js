import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  addBusinessRule,
  deleteBusinessRule,
  addApiEndpoint,
  deleteApiEndpoint
} from '../../actions/projectActions';
import { setAlert } from '../../actions/alertActions';

const LayeredArchitecture = () => {
  const dispatch = useDispatch();
  const architecture = useSelector(
    (state) => state.project.currentProject.architecture || {}
  );

  const [activeLayer, setActiveLayer] = useState('business');

  // Business rule form
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [newRule, setNewRule] = useState({ title: '', desc: '' });

  // API endpoint form
  const [showApiModal, setShowApiModal] = useState(false);
  const [newEndpoint, setNewEndpoint] = useState({
    method: 'GET',
    path: '',
    access: 'Public',
    desc: ''
  });

  const handleAddRule = (e) => {
    e.preventDefault();
    if (!newRule.title || !newRule.desc) return;
    dispatch(
      addBusinessRule({
        id: 'b_' + Date.now(),
        title: newRule.title,
        desc: newRule.desc
      })
    );
    setNewRule({ title: '', desc: '' });
    setShowRuleModal(false);
    dispatch(setAlert('Business domain rule registered', 'success'));
  };

  const handleAddEndpoint = (e) => {
    e.preventDefault();
    if (!newEndpoint.path || !newEndpoint.desc) return;
    dispatch(addApiEndpoint({ ...newEndpoint }));
    setNewEndpoint({ method: 'GET', path: '', access: 'Public', desc: '' });
    setShowApiModal(false);
    dispatch(setAlert('Functional API endpoint registered', 'success'));
  };

  const getMethodBadgeClass = (method) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'badge-cyan';
      case 'POST':
        return 'badge-emerald';
      case 'PUT':
        return 'badge-amber';
      case 'DELETE':
        return 'badge-rose';
      default:
        return 'badge-purple';
    }
  };

  return (
    <div className="tab-content">
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <i className="fa-solid fa-layer-group" style={{ color: 'var(--accent-indigo)' }}></i>
            Multi-Tier Layered Architecture Design
          </h2>
          <p className="section-desc">
            Formal design separating Business Rules, Persistent Data Schemas, and Functional API Contracts.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`filter-btn ${activeLayer === 'business' ? 'active' : ''}`}
            onClick={() => setActiveLayer('business')}
          >
            1. Business Layer ({architecture.businessLayer?.length || 0})
          </button>
          <button
            className={`filter-btn ${activeLayer === 'data' ? 'active' : ''}`}
            onClick={() => setActiveLayer('data')}
          >
            2. Data Layer ({architecture.dataLayer?.length || 0})
          </button>
          <button
            className={`filter-btn ${activeLayer === 'functional' ? 'active' : ''}`}
            onClick={() => setActiveLayer('functional')}
          >
            3. Functional Layer ({architecture.functionalLayer?.length || 0})
          </button>
        </div>
      </div>

      {/* Layer 1: Business Layer */}
      {activeLayer === 'business' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>
              Business Domain Policies & Governance Invariants
            </h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowRuleModal(true)}>
              <i className="fa-solid fa-plus"></i>
              Add Domain Rule
            </button>
          </div>

          <div className="grid-2">
            {(architecture.businessLayer || []).map((rule) => (
              <div key={rule.id} className="card">
                <div className="card-header">
                  <h4 className="card-title" style={{ fontSize: '1rem' }}>
                    <i className="fa-solid fa-shield-halved" style={{ color: 'var(--accent-cyan)' }}></i>
                    {rule.title}
                  </h4>
                  <button
                    className="btn btn-danger btn-sm"
                    style={{ padding: '0.2rem 0.5rem' }}
                    onClick={() => dispatch(deleteBusinessRule(rule.id))}
                  >
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{rule.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Layer 2: Data Layer */}
      {activeLayer === 'data' && (
        <div>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>
              Data Layer Architecture & Indexing Topology
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Specifies persistence abstractions, collection types, cardinality, and search indexing patterns.
            </p>
          </div>

          <div className="card" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Collection / Table</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Storage Paradigm</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Cardinality Multiplicity</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Indexing Strategy</th>
                </tr>
              </thead>
              <tbody>
                {(architecture.dataLayer || []).map((d, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-code)', fontWeight: '600', color: 'var(--accent-cyan)' }}>
                      {d.collection}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>{d.type}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{d.count}</td>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-code)', color: 'var(--accent-indigo)' }}>
                      {d.index}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Layer 3: Functional Layer */}
      {activeLayer === 'functional' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                Functional Layer REST API Contracts
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Application service entrypoints, authorization guards, and request routing specifications.
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowApiModal(true)}>
              <i className="fa-solid fa-plus"></i>
              Add REST Endpoint
            </button>
          </div>

          <div className="card" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>HTTP Verb</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Route Path</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Access Guard</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Functional Responsibility</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(architecture.functionalLayer || []).map((f, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span className={`badge ${getMethodBadgeClass(f.method)}`}>
                        {f.method}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-code)', fontWeight: '600', color: 'var(--text-main)' }}>
                      {f.path}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span className={`badge ${f.access === 'Private' ? 'badge-amber' : 'badge-emerald'}`}>
                        {f.access}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{f.desc}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <button
                        className="btn btn-danger btn-sm"
                        style={{ padding: '0.2rem 0.5rem' }}
                        onClick={() => dispatch(deleteApiEndpoint(idx))}
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Business Rule Modal */}
      {showRuleModal && (
        <div className="modal-backdrop" onClick={() => setShowRuleModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Define Business Domain Rule</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowRuleModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleAddRule}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Rule Title / Policy Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Idempotent Reaction Enforcement"
                    value={newRule.title}
                    onChange={(e) => setNewRule({ ...newRule, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Policy Invariants & Enforcement Logic</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Describe invariant checks, error conditions, and cascading actions..."
                    value={newRule.desc}
                    onChange={(e) => setNewRule({ ...newRule, desc: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRuleModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Business Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add API Endpoint Modal */}
      {showApiModal && (
        <div className="modal-backdrop" onClick={() => setShowApiModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add REST API Endpoint Contract</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowApiModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleAddEndpoint}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">HTTP Method</label>
                    <select
                      className="form-select"
                      value={newEndpoint.method}
                      onChange={(e) => setNewEndpoint({ ...newEndpoint, method: e.target.value })}
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                      <option value="PATCH">PATCH</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Route Path</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. /api/v1/resources/:id"
                      value={newEndpoint.path}
                      onChange={(e) => setNewEndpoint({ ...newEndpoint, path: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Access Guard</label>
                  <select
                    className="form-select"
                    value={newEndpoint.access}
                    onChange={(e) => setNewEndpoint({ ...newEndpoint, access: e.target.value })}
                  >
                    <option value="Public">Public (No Token)</option>
                    <option value="Private">Private (JWT Bearer Token Required)</option>
                    <option value="Admin">Admin Only</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Functional Description</label>
                  <textarea
                    className="form-textarea"
                    placeholder="State input requirements, payload validation, and expected HTTP responses..."
                    value={newEndpoint.desc}
                    onChange={(e) => setNewEndpoint({ ...newEndpoint, desc: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowApiModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Register Endpoint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LayeredArchitecture;
