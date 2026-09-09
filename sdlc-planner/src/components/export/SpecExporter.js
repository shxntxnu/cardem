import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { generateMarkdownSpec } from '../../utils/markdownGenerator';
import { setAlert } from '../../actions/alertActions';

const SpecExporter = () => {
  const dispatch = useDispatch();
  const project = useSelector((state) => state.project.currentProject);

  const markdownContent = generateMarkdownSpec(project);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    dispatch(setAlert('Complete Markdown specification copied to clipboard', 'success'));
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownloadMD = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.id || 'system'}_SDLC_PLANNING_SPECIFICATION.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    dispatch(setAlert('Markdown document downloaded', 'info'));
  };

  const handleDownloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2));
    const link = document.createElement('a');
    link.href = dataStr;
    link.download = `${project.id || 'system'}_blueprint.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    dispatch(setAlert('Full project JSON blueprint exported', 'info'));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="tab-content">
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <i className="fa-solid fa-file-lines" style={{ color: 'var(--accent-cyan)' }}></i>
            SDLC Specification Exporter & Document Compiler
          </h2>
          <p className="section-desc">
            Instantly compile your layered architecture, ERD, system flows, and user stories into publication-grade Markdown or JSON.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={handlePrint}>
            <i className="fa-solid fa-print"></i>
            Print / PDF
          </button>
          <button className="btn btn-outline btn-sm" onClick={handleDownloadJSON}>
            <i className="fa-solid fa-file-code"></i>
            Export JSON
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
            <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'}`}></i>
            {copied ? 'Copied!' : 'Copy Markdown'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleDownloadMD}>
            <i className="fa-solid fa-download"></i>
            Download Specification (.md)
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="card-header" style={{ padding: '0.75rem 1.25rem', margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-brands fa-markdown" style={{ color: 'var(--accent-cyan)', fontSize: '1.2rem' }}></i>
            <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>
              Compiled Specification Preview: {project.name}.md
            </span>
          </div>
          <span className="badge badge-emerald">Ready for Export</span>
        </div>

        <div style={{ padding: '1.5rem', background: '#050811' }}>
          <pre
            style={{
              fontFamily: 'var(--font-code)',
              fontSize: '0.85rem',
              color: '#94a3b8',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxHeight: '650px',
              overflowY: 'auto',
              lineHeight: 1.6
            }}
          >
            {markdownContent}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default SpecExporter;
