import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addEntity, deleteEntity, updateErdSyntax } from '../../actions/projectActions';
import { setAlert } from '../../actions/alertActions';
import MermaidViewer from '../common/MermaidViewer';

const ErdStudio = () => {
  const dispatch = useDispatch();
  const erd = useSelector((state) => state.project.currentProject.erd || {});
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditingSyntax, setIsEditingSyntax] = useState(false);
  const [syntaxDraft, setSyntaxDraft] = useState(erd.mermaidSyntax || '');

  // Add entity form state
  const [newEntity, setNewEntity] = useState({
    name: '',
    description: '',
    fields: [
      { name: '_id', type: 'ObjectId', key: 'PK' },
      { name: 'created_at', type: 'Date', key: '' }
    ]
  });

  const handleAddField = () => {
    setNewEntity({
      ...newEntity,
      fields: [...newEntity.fields, { name: '', type: 'String', key: '' }]
    });
  };

  const handleFieldChange = (index, prop, value) => {
    const updated = [...newEntity.fields];
    updated[index][prop] = value;
    setNewEntity({ ...newEntity, fields: updated });
  };

  const handleRemoveField = (index) => {
    setNewEntity({
      ...newEntity,
      fields: newEntity.fields.filter((_, idx) => idx !== index)
    });
  };

  const handleSaveEntity = (e) => {
    e.preventDefault();
    if (!newEntity.name.trim()) return;

    dispatch(
      addEntity({
        id: 'ent_' + Date.now(),
        name: newEntity.name.toUpperCase().trim(),
        description: newEntity.description,
        fields: newEntity.fields.filter((f) => f.name.trim() !== '')
      })
    );

    setNewEntity({
      name: '',
      description: '',
      fields: [
        { name: '_id', type: 'ObjectId', key: 'PK' },
        { name: 'created_at', type: 'Date', key: '' }
      ]
    });
    setShowAddModal(false);
    dispatch(setAlert(`Entity "${newEntity.name.toUpperCase()}" added to ERD`, 'success'));
  };

  const handleSaveSyntax = () => {
    dispatch(updateErdSyntax(syntaxDraft));
    setIsEditingSyntax(false);
    dispatch(setAlert('Mermaid ERD syntax updated', 'info'));
  };

  const copySyntax = () => {
    navigator.clipboard.writeText(erd.mermaidSyntax || '');
    dispatch(setAlert('Mermaid ERD code copied to clipboard', 'info'));
  };

  return (
    <div className="tab-content">
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <i className="fa-solid fa-database" style={{ color: 'var(--accent-cyan)' }}></i>
            Entity Relationship (ERD) Studio & Data Dictionary
          </h2>
          <p className="section-desc">
            Conceptual and physical entity schemas, primary/foreign key constraints, and dynamic Mermaid ERD visualizer.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={copySyntax}>
            <i className="fa-regular fa-copy"></i>
            Copy Mermaid Code
          </button>
          <button
            className={`btn ${isEditingSyntax ? 'btn-primary' : 'btn-outline'} btn-sm`}
            onClick={() => {
              if (isEditingSyntax) {
                handleSaveSyntax();
              } else {
                setSyntaxDraft(erd.mermaidSyntax || '');
                setIsEditingSyntax(true);
              }
            }}
          >
            <i className={`fa-solid ${isEditingSyntax ? 'fa-check' : 'fa-code'}`}></i>
            {isEditingSyntax ? 'Apply Syntax' : 'Edit Mermaid Code'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
            <i className="fa-solid fa-plus"></i>
            Add Entity
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 1fr) 1.4fr', gap: '1.5rem' }}>
        {/* Left Column: Entity Cards (Data Dictionary) */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>
              Data Dictionary ({erd.entities?.length || 0} Entities)
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {(erd.entities || []).map((ent) => (
              <div key={ent.id} className="entity-card">
                <div className="entity-card-header">
                  <div>
                    <span className="entity-name">{ent.name}</span>
                    {ent.description && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {ent.description}
                      </p>
                    )}
                  </div>
                  <button
                    className="btn btn-danger btn-sm"
                    style={{ padding: '0.2rem 0.4rem' }}
                    onClick={() => dispatch(deleteEntity(ent.id))}
                  >
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                </div>
                <div className="entity-field-list">
                  {(ent.fields || []).map((fld, idx) => (
                    <div key={idx} className="entity-field-row">
                      <div className="field-name-group">
                        {fld.key === 'PK' && <span className="field-key-badge field-key-pk">PK</span>}
                        {fld.key === 'FK' && <span className="field-key-badge field-key-fk">FK</span>}
                        {fld.key === 'UK' && <span className="field-key-badge" style={{ background: 'rgba(52, 211, 153, 0.2)', color: 'var(--accent-emerald)' }}>UK</span>}
                        <span>{fld.name}</span>
                      </div>
                      <span className="field-type">{fld.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Live Mermaid Visualizer */}
        <div>
          <div className="diagram-viewer-card">
            <div className="diagram-toolbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-project-diagram" style={{ color: 'var(--accent-cyan)' }}></i>
                <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Live Mermaid ERD Canvas</span>
              </div>
              <span className="badge badge-cyan">Crow's Foot Notation</span>
            </div>

            {isEditingSyntax ? (
              <div style={{ padding: '1rem' }}>
                <textarea
                  className="diagram-code-editor"
                  style={{ minHeight: '350px' }}
                  value={syntaxDraft}
                  onChange={(e) => setSyntaxDraft(e.target.value)}
                />
                <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setIsEditingSyntax(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={handleSaveSyntax}>
                    Save and Re-render
                  </button>
                </div>
              </div>
            ) : (
              <MermaidViewer chartCode={erd.mermaidSyntax || 'erDiagram'} id="erd-canvas" />
            )}
          </div>
        </div>
      </div>

      {/* Add Entity Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Define New Domain Entity</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleSaveEntity}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Entity Name (UPPERCASE)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. INVOICE, NOTIFICATION, REPOSITORY"
                    value={newEntity.name}
                    onChange={(e) => setNewEntity({ ...newEntity, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description / Business Purpose</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Stores billing details and payment receipts"
                    value={newEntity.description}
                    onChange={(e) => setNewEntity({ ...newEntity, description: e.target.value })}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>Entity Fields & Attributes</label>
                    <button type="button" className="btn btn-outline btn-sm" onClick={handleAddField}>
                      <i className="fa-solid fa-plus"></i> Add Field
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto' }}>
                    {newEntity.fields.map((f, index) => (
                      <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 36px', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Field name"
                          value={f.name}
                          onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                          required
                        />
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Data type"
                          value={f.type}
                          onChange={(e) => handleFieldChange(index, 'type', e.target.value)}
                          required
                        />
                        <select
                          className="form-select"
                          value={f.key}
                          onChange={(e) => handleFieldChange(index, 'key', e.target.value)}
                        >
                          <option value="">-</option>
                          <option value="PK">PK</option>
                          <option value="FK">FK</option>
                          <option value="UK">UK</option>
                        </select>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          style={{ padding: '0.4rem' }}
                          onClick={() => handleRemoveField(index)}
                        >
                          <i className="fa-solid fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Entity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ErdStudio;
