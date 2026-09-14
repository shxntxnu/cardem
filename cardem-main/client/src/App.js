import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store';
import { loadUser } from './actions/auth';
import setAuthToken from './utils/setAuthToken';

// Layout & Common
import Navbar from './components/layout/Navbar';
import Alert from './components/layout/Alert';
import PrivateRoute from './components/routing/PrivateRoute';

// Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Core Feature Components
import Dashboard from './components/dashboard/Dashboard';
import GarageView from './components/garage/GarageView';
import CreateConvoy from './components/convoy/CreateConvoy';
import ConvoyLobby from './components/convoy/ConvoyLobby';
import ConvoyMapHUD from './components/map/ConvoyMapHUD';
import ConvoysView from './components/convoy/ConvoysView';
import AlertsFeed from './components/alerts/AlertsFeed';
import Leaderboard from './components/leaderboard/Leaderboard';

import './App.css';

// Sync token from localStorage into default Axios headers
if (localStorage.token) {
  setAuthToken(localStorage.token);
}

const App = () => {
  useEffect(() => {
    store.dispatch(loadUser());
  }, []);

  return (
    <Provider store={store}>
      <Router>
        <div className="app-container">
          <Navbar />
          <Alert />

          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />

              {/* Protected Driver & Convoy Routes */}
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/garage"
                element={
                  <PrivateRoute>
                    <GarageView />
                  </PrivateRoute>
                }
              />
              <Route
                path="/convoys/new"
                element={
                  <PrivateRoute>
                    <CreateConvoy />
                  </PrivateRoute>
                }
              />
              <Route
                path="/create-convoy"
                element={
                  <PrivateRoute>
                    <CreateConvoy />
                  </PrivateRoute>
                }
              />
              <Route
                path="/convoys"
                element={
                  <PrivateRoute>
                    <ConvoysView />
                  </PrivateRoute>
                }
              />
              <Route
                path="/convoy/:id"
                element={
                  <PrivateRoute>
                    <ConvoyLobby />
                  </PrivateRoute>
                }
              />
              <Route
                path="/convoy/:id/drive"
                element={
                  <PrivateRoute>
                    <ConvoyMapHUD />
                  </PrivateRoute>
                }
              />
              <Route
                path="/drive"
                element={
                  <PrivateRoute>
                    <ConvoyMapHUD />
                  </PrivateRoute>
                }
              />
              <Route
                path="/map"
                element={
                  <PrivateRoute>
                    <ConvoyMapHUD />
                  </PrivateRoute>
                }
              />
              <Route
                path="/alerts"
                element={
                  <PrivateRoute>
                    <AlertsFeed />
                  </PrivateRoute>
                }
              />
              <Route
                path="/leaderboard"
                element={
                  <PrivateRoute>
                    <Leaderboard />
                  </PrivateRoute>
                }
              />

              {/* Default Redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </Provider>
  );
};

export default App;
