import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../../actions/auth';
import { setAlert } from '../../actions/alert';

const Register = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const { name, email, password, confirmPassword } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      dispatch(setAlert('Passwords do not match', 'danger'));
    } else {
      dispatch(register({ name: name.trim(), email: email.trim(), password }));
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="auth-mobile-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-badge">
            <i className="fa-solid fa-flag-checkered"></i>
          </div>
          <h2>Join Cardem</h2>
          <p>Create your enthusiast identity & register your garage</p>
        </div>

        <form onSubmit={onSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">
              <i className="fa-solid fa-id-card"></i> Driver Name / Callsign
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. ApexHunter"
              name="name"
              value={name}
              onChange={onChange}
              required
            />
          </div>

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
              placeholder="Min 6 characters"
              name="password"
              value={password}
              onChange={onChange}
              minLength="6"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <i className="fa-solid fa-shield-halved"></i> Confirm Password
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="Repeat password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={onChange}
              minLength="6"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg">
            <span>Register Driver</span>
            <i className="fa-solid fa-arrow-right"></i>
          </button>
        </form>

        <div className="auth-footer">
          <span>Already registered with Cardem?</span>
          <Link to="/login" className="auth-link">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
