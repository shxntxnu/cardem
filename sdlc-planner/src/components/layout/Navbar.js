import React from 'react';
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loadTemplate, importProjectJSON } from '../../actions/projectActions';
import { setAlert } from '../../actions/alertActions';

const Navbar = () => {
  const dispatch = useDispatch();
  const currentProject = useSelector((state) => state.project.currentProject);
  const activeTemplateId = useSelector((state) => state.project.activeTemplateId);

  const handleTemplateChange = (e) => {
    const templateId = e.target.value;
    dispatch(loadTemplate(templateId));
    dispatch(setAlert(`Loaded "${templateId.toUpperCase()}" architecture blueprint`, 'success'));
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentProject, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${currentProject.id || 'project'}_sdlc_plan.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    dispatch(setAlert('Project blueprint exported as JSON', 'info'));
  };

  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          dispatch(importProjectJSON(parsed));
          dispatch(setAlert(`Successfully imported "${parsed.name || 'Custom Project'}"`, 'success'));
        } catch (err) {
          dispatch(setAlert('Failed to parse JSON file', 'danger'));
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="brand-wrapper">
          <div className="brand-icon">
            <i className="fa-solid fa-compass-drafting"></i>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="brand-title">PlanCraft SDLC</span>
              <span className="brand-badge">Studio v2.0</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Universal Architecture & Inception Workbench
            </div>
          </div>
        </div>

        <div className="header-actions">
          <div className="project-selector">
            <i className="fa-solid fa-folder-open" style={{ color: 'var(--accent-cyan)' }}></i>
            <span>Blueprint:</span>
            <select
              className="project-select-input"
              value={activeTemplateId}
              onChange={handleTemplateChange}
            >
              <option value="devconnector">DevConnector (MERN Social Network)</option>
              <option value="ecommerce">NexusMarket (E-Commerce Platform)</option>
              <option value="blank">Blank Custom Project (Plan Any App)</option>
            </select>
          </div>

          <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
            <i className="fa-solid fa-file-arrow-up"></i>
            <span>Import JSON</span>
            <input
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImportJSON}
            />
          </label>

          <button className="btn btn-outline btn-sm" onClick={handleExportJSON}>
            <i className="fa-solid fa-download"></i>
            <span>Backup JSON</span>
          </button>
        </div>
      </div>

      <nav className="nav-tabs-bar" style={{ marginTop: '0.75rem' }}>
        <div className="nav-tabs-inner">
          <NavLink
            to="/"
            className={({ isActive }) => `nav-tab-btn ${isActive ? 'active' : ''}`}
          >
            <i className="fa-solid fa-gauge-high"></i>
            <span>1. Overview & Stack</span>
          </NavLink>

          <NavLink
            to="/architecture"
            className={({ isActive }) => `nav-tab-btn ${isActive ? 'active' : ''}`}
          >
            <i className="fa-solid fa-layer-group"></i>
            <span>2. Layered Architecture</span>
          </NavLink>

          <NavLink
            to="/erd"
            className={({ isActive }) => `nav-tab-btn ${isActive ? 'active' : ''}`}
          >
            <i className="fa-solid fa-database"></i>
            <span>3. ERD & Data Dictionary</span>
          </NavLink>

          <NavLink
            to="/flows"
            className={({ isActive }) => `nav-tab-btn ${isActive ? 'active' : ''}`}
          >
            <i className="fa-solid fa-diagram-project"></i>
            <span>4. Flows & UML Diagrams</span>
          </NavLink>

          <NavLink
            to="/stories"
            className={({ isActive }) => `nav-tab-btn ${isActive ? 'active' : ''}`}
          >
            <i className="fa-solid fa-list-check"></i>
            <span>5. Agile User Stories & Points</span>
          </NavLink>

          <NavLink
            to="/roadmap"
            className={({ isActive }) => `nav-tab-btn ${isActive ? 'active' : ''}`}
          >
            <i className="fa-solid fa-road"></i>
            <span>6. Roadmap & Tech Debt</span>
          </NavLink>

          <NavLink
            to="/export"
            className={({ isActive }) => `nav-tab-btn ${isActive ? 'active' : ''}`}
          >
            <i className="fa-solid fa-file-lines"></i>
            <span>7. Spec Exporter (.md)</span>
          </NavLink>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
