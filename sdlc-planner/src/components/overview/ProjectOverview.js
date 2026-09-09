import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateMetadata } from '../../actions/projectActions';
import { setAlert } from '../../actions/alertActions';
import AiPromptStudio from './AiPromptStudio';

const ProjectOverview = () => {
  const dispatch = useDispatch();
  const project = useSelector((state) => state.project.currentProject);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: project.name || '',
    version: project.version || '1.0.0',
    description: project.description || '',
    frontend: project.targetStack?.frontend || '',
    backend: project.targetStack?.backend || '',
    database: project.targetStack?.database || '',
    external: project.targetStack?.external || ''
  });

  const totalPoints = (project.stories || []).reduce(
    (acc, s) => acc + (parseInt(s.points) || 0),
    0
  );
  const entityCount = project.erd?.entities?.length || 0;
  const endpointCount = project.architecture?.functionalLayer?.length || 0;
  const roadmapCount = project.roadmap?.length || 0;

  const handleSave = (e) => {
    e.preventDefault();
    dispatch(
      updateMetadata({
        name: formData.name,
        version: formData.version,
        description: formData.description,
        targetStack: {
          frontend: formData.frontend,
          backend: formData.backend,
          database: formData.database,
          external: formData.external
        }
      })
    );
    setIsEditing(false);
    dispatch(setAlert('Project metadata updated successfully', 'success'));
  };

  return (
    <div className="tab-content">
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <i className="fa-solid fa-compass-drafting" style={{ color: 'var(--accent-cyan)' }}></i>
            {project.name}
          </h2>
          <p className="section-desc">{project.description}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`btn ${isEditing ? 'btn-secondary' : 'btn-outline'}`}
            onClick={() => setIsEditing(!isEditing)}
          >
            <i className={`fa-solid ${isEditing ? 'fa-xmark' : 'fa-pen-to-square'}`}></i>
            <span>{isEditing ? 'Cancel Edit' : 'Edit Project Metadata'}</span>
          </button>
        </div>
      </div>

      {/* Metric Dashboard */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--accent-indigo)' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Total Backlog Scope
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--accent-indigo)', margin: '0.25rem 0' }}>
            {totalPoints} <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Story Points</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Across {project.stories?.length || 0} user stories
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Data Model Entities
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--accent-cyan)', margin: '0.25rem 0' }}>
            {entityCount} <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Entities</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Defined in Data Dictionary & ERD
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--accent-emerald)' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Functional API Contracts
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--accent-emerald)', margin: '0.25rem 0' }}>
            {endpointCount} <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Endpoints</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            REST Endpoints & Middleware Guards
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--accent-purple)' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Evolution Horizons
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--accent-purple)', margin: '0.25rem 0' }}>
            {roadmapCount} <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Initiatives</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Prioritized in Future Work
          </div>
        </div>
      </div>

      {/* AI Prompt Studio for Feature Evolution & System Inception */}
      <AiPromptStudio />

      {isEditing ? (
        <form onSubmit={handleSave} className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h3 className="card-title">
              <i className="fa-solid fa-sliders"></i>
              Edit System Information & Target Stack
            </h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">System / Program Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">SDLC Release Version</label>
              <input
                type="text"
                className="form-input"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                required
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">System Scope & Purpose</label>
              <textarea
                className="form-textarea"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Frontend Stack</label>
              <input
                type="text"
                className="form-input"
                value={formData.frontend}
                onChange={(e) => setFormData({ ...formData, frontend: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Backend Stack</label>
              <input
                type="text"
                className="form-input"
                value={formData.backend}
                onChange={(e) => setFormData({ ...formData, backend: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Database Tier</label>
              <input
                type="text"
                className="form-input"
                value={formData.database}
                onChange={(e) => setFormData({ ...formData, database: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">External Services / Cloud</label>
              <input
                type="text"
                className="form-input"
                value={formData.external}
                onChange={(e) => setFormData({ ...formData, external: e.target.value })}
              />
            </div>
          </div>
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <i className="fa-solid fa-check"></i>
              Save Changes
            </button>
          </div>
        </form>
      ) : null}

      {/* Target Stack Cards */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <i className="fa-solid fa-laptop-code" style={{ color: 'var(--accent-cyan)' }}></i>
              Frontend Presentation Tier
            </h3>
            <span className="badge badge-cyan">Client SPA</span>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            {project.targetStack?.frontend || 'Not specified'}
          </p>
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Responsible for user interfaces, state management, asynchronous API invocations, and route authentication guards.
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <i className="fa-solid fa-server" style={{ color: 'var(--accent-indigo)' }}></i>
              Backend Application Tier
            </h3>
            <span className="badge badge-purple">Node / Express</span>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            {project.targetStack?.backend || 'Not specified'}
          </p>
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Executes request authorization, domain business validation rules, controller routing, and data mutations.
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <i className="fa-solid fa-database" style={{ color: 'var(--accent-emerald)' }}></i>
              Persistent Data Tier
            </h3>
            <span className="badge badge-emerald">Document Store</span>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            {project.targetStack?.database || 'Not specified'}
          </p>
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Maintains structured collections, unique secondary indexes, embedded subdocuments, and referential cascades.
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <i className="fa-solid fa-cloud" style={{ color: 'var(--accent-amber)' }}></i>
              External Cloud Services
            </h3>
            <span className="badge badge-amber">Integrations</span>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            {project.targetStack?.external || 'Not specified'}
          </p>
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Connects third-party APIs for real-time repository ingestion, profile avatar derivation, and media storage.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectOverview;
