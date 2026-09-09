import React from 'react';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store';

import Navbar from './components/layout/Navbar';
import Alert from './components/layout/Alert';
import ProjectOverview from './components/overview/ProjectOverview';
import LayeredArchitecture from './components/architecture/LayeredArchitecture';
import ErdStudio from './components/erd/ErdStudio';
import FlowsStudio from './components/flows/FlowsStudio';
import UserStoriesBoard from './components/stories/UserStoriesBoard';
import RoadmapStudio from './components/roadmap/RoadmapStudio';
import SpecExporter from './components/export/SpecExporter';

import './App.css';

const App = () => {
  return (
    <Provider store={store}>
      <Router>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Navbar />
          <main className="app-container" style={{ flex: 1 }}>
            <Alert />
            <Routes>
              <Route path="/" element={<ProjectOverview />} />
              <Route path="/architecture" element={<LayeredArchitecture />} />
              <Route path="/erd" element={<ErdStudio />} />
              <Route path="/flows" element={<FlowsStudio />} />
              <Route path="/stories" element={<UserStoriesBoard />} />
              <Route path="/roadmap" element={<RoadmapStudio />} />
              <Route path="/export" element={<SpecExporter />} />
              <Route path="*" element={<ProjectOverview />} />
            </Routes>
          </main>
          <footer
            style={{
              textAlign: 'center',
              padding: '1.5rem',
              borderTop: '1px solid var(--border-color)',
              color: 'var(--text-dim)',
              fontSize: '0.8rem'
            }}
          >
            PlanCraft SDLC Studio &copy; {new Date().getFullYear()} &bull; Architecture & System Design Inception Suite
          </footer>
        </div>
      </Router>
    </Provider>
  );
};

export default App;
