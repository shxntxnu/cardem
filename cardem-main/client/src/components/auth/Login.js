import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../../actions/auth';

const Login = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const { email, password } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = (e) => {
    e.preventDefault();
    dispatch(login(email, password));
  };

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="auth-mobile-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-badge">
            <i className="fa-solid fa-gauge-high"></i>
          </div>
          <h2>Welcome Driver</h2>
          <p>Sign in to join active convoys & connect with enthusiasts</p>
        </div>

        <form onSubmit={onSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">
              <i className="fa-solid fa-envelope"></i> Email Address
            </label>
            <input
              type="email"
              className="form-input"
              placeholder="driver@cardem.com"
              name="email"
              value={email}
              onChange={onChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <i className="fa-solid fa-lock"></i> Password
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              name="password"
              value={password}
              onChange={onChange}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg">
            <span>Start Engine</span>
            <i className="fa-solid fa-key"></i>
          </button>
        </form>

        <div className="auth-footer">
          <span>Don't have an enthusiast account?</span>
          <Link to="/register" className="auth-link">
            Create Profile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
