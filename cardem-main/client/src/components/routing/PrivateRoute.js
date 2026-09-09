import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PrivateRoute = ({ component: Component }) => {
  const auth = useSelector((state) => state.auth);
  const { isAuthenticated, loading } = auth;

  // Prevent redirect flash while token is being verified
  if (loading) {
    return (
      <div className="loading-spinner-wrapper">
        <div className="spinner"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Component />;
  }

  return <Navigate to="/login" replace />;
};

export default PrivateRoute;
