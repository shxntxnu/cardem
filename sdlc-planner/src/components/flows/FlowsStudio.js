import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateDiagramSyntax } from '../../actions/projectActions';
import { setAlert } from '../../actions/alertActions';
import MermaidViewer from '../common/MermaidViewer';

const FlowsStudio = () => {
  const dispatch = useDispatch();
  const diagrams = useSelector(
    (state) => state.project.currentProject.diagrams || {}
  );

  const [activeDiagramType, setActiveDiagramType] = useState('dfdLevel0');
  const [isEditing, setIsEditing] = useState(false);
  const [draftCode, setDraftCode] = useState('');

  const diagramMetadata = {
    dfdLevel0: {
      title: 'Data Flow Diagram (Level 0 - Context Diagram)',
      desc: 'Visualizes external human and system actors interacting across the application boundary.',
      key: 'dfdLevel0'
    },
    dfdLevel1: {
      title: 'Data Flow Diagram (Level 1 - Functional Decomposition)',
      desc: 'Decomposes primary business processes and their interactions with dedicated data stores.',
      key: 'dfdLevel1'
    },
    classDiagram: {
      title: 'UML Class & Structural Diagram',
      desc: 'Object-oriented structural modeling capturing classes, attributes, methods, and relationships.',
      key: 'classDiagram'
    },
    sequenceAuth: {
      title: 'Event Sequence Diagram',
      desc: 'Chronological message exchange between actors, presentation views, API routers, and database tiers.',
      key: 'sequenceAuth'
    }
  };

  const currentMeta = diagramMetadata[activeDiagramType];
  const currentSyntax = diagrams[currentMeta.key] || '';

  const handleStartEditing = () => {
    setDraftCode(currentSyntax);
    setIsEditing(true);
  };

  const handleSave = () => {
    dispatch(updateDiagramSyntax(currentMeta.key, draftCode));
    setIsEditing(false);
    dispatch(setAlert('Diagram syntax saved and re-rendered', 'success'));
  };

  const copyCode = () => {
    navigator.clipboard.writeText(currentSyntax);
    dispatch(setAlert('Mermaid diagram code copied to clipboard', 'info'));
  };

  return (
    <div className="tab-content">
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <i className="fa-solid fa-diagram-project" style={{ color: 'var(--accent-purple)' }}></i>
            Data Flow, Class Diagram & Event Sequence Studio
          </h2>
          <p className="section-desc">
            Behavioral and structural UML modeling rendered dynamically using Mermaid notation.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={copyCode}>
            <i className="fa-regular fa-copy"></i>
            Copy Code
          </button>
          <button
            className={`btn ${isEditing ? 'btn-primary' : 'btn-outline'} btn-sm`}
            onClick={() => {
              if (isEditing) {
                handleSave();
              } else {
                handleStartEditing();
              }
            }}
          >
            <i className={`fa-solid ${isEditing ? 'fa-check' : 'fa-code'}`}></i>
            {isEditing ? 'Apply Syntax' : 'Edit Diagram Code'}
          </button>
        </div>
      </div>

      {/* Diagram Sub-tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          className={`filter-btn ${activeDiagramType === 'dfdLevel0' ? 'active' : ''}`}
          onClick={() => {
            setActiveDiagramType('dfdLevel0');
            setIsEditing(false);
          }}
        >
          <i className="fa-solid fa-arrows-split-up-and-left" style={{ marginRight: '6px' }}></i>
          DFD Level 0 (Context)
        </button>
        <button
          className={`filter-btn ${activeDiagramType === 'dfdLevel1' ? 'active' : ''}`}
          onClick={() => {
            setActiveDiagramType('dfdLevel1');
            setIsEditing(false);
          }}
        >
          <i className="fa-solid fa-network-wired" style={{ marginRight: '6px' }}></i>
          DFD Level 1 (Decomposition)
        </button>
        <button
          className={`filter-btn ${activeDiagramType === 'classDiagram' ? 'active' : ''}`}
          onClick={() => {
            setActiveDiagramType('classDiagram');
            setIsEditing(false);
          }}
        >
          <i className="fa-solid fa-cube" style={{ marginRight: '6px' }}></i>
          UML Class Diagram
        </button>
        <button
          className={`filter-btn ${activeDiagramType === 'sequenceAuth' ? 'active' : ''}`}
          onClick={() => {
            setActiveDiagramType('sequenceAuth');
            setIsEditing(false);
          }}
        >
          <i className="fa-solid fa-timeline" style={{ marginRight: '6px' }}></i>
          Event Sequence Flow
        </button>
      </div>

      {/* Main Diagram Viewer Card */}
      <div className="diagram-viewer-card">
        <div className="diagram-toolbar">
          <div>
            <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-main)' }}>
              {currentMeta.title}
            </span>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {currentMeta.desc}
            </p>
          </div>
          <span className="badge badge-purple">Mermaid SVG</span>
        </div>

        {isEditing ? (
          <div style={{ padding: '1.25rem' }}>
            <textarea
              className="diagram-code-editor"
              style={{ minHeight: '380px' }}
              value={draftCode}
              onChange={(e) => setDraftCode(e.target.value)}
            />
            <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleSave}>
                Save and Re-render
              </button>
            </div>
          </div>
        ) : (
          <MermaidViewer chartCode={currentSyntax} id={`diagram-${activeDiagramType}`} />
        )}
      </div>
    </div>
  );
};

export default FlowsStudio;
