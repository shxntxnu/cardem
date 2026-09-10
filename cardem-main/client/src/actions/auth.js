import api from '../utils/api';
import setAuthToken from '../utils/setAuthToken';
import { setAlert } from './alert';
import {
  REGISTER_SUCCESS,
  REGISTER_FAIL,
  USER_LOADED,
  USER_UPDATED,
  AUTH_ERROR,
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  LOGOUT,
  CLEAR_PROFILE,
  UPDATE_PROFILE
} from './types';

// Load Authenticated Driver
export const loadUser = () => async (dispatch) => {
  const token = localStorage.getItem('token');
  if (token) {
    setAuthToken(token);
  }

  try {
    const res = await api.get('/auth');

    dispatch({
      type: USER_LOADED,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: AUTH_ERROR
    });
  }
};

// Register Driver
export const register = (formData) => async (dispatch) => {
  try {
    const res = await api.post('/users', formData);

    dispatch({
      type: REGISTER_SUCCESS,
      payload: res.data
    });

    dispatch(loadUser());
    dispatch(setAlert('Driver account registered successfully!', 'success'));
  } catch (err) {
    const errors = err.response?.data?.errors;

    if (errors) {
      errors.forEach((error) => dispatch(setAlert(error.msg, 'danger')));
    } else {
      dispatch(setAlert('Registration failed. Please try again.', 'danger'));
    }

    dispatch({
      type: REGISTER_FAIL
    });
  }
};

// Login Driver
export const login = (email, password) => async (dispatch) => {
  const body = { email, password };

  try {
    const res = await api.post('/auth', body);

    dispatch({
      type: LOGIN_SUCCESS,
      payload: res.data
    });

    dispatch(loadUser());
    dispatch(setAlert('Welcome back to Cardem Convoy!', 'success'));
  } catch (err) {
    const errors = err.response?.data?.errors;

    if (errors) {
      errors.forEach((error) => dispatch(setAlert(error.msg, 'danger')));
    } else {
      dispatch(setAlert('Invalid email or password.', 'danger'));
    }

    dispatch({
      type: LOGIN_FAIL
    });
  }
};

// Logout Driver & Clear Profile
export const logout = () => (dispatch) => {
  dispatch({ type: CLEAR_PROFILE });
  dispatch({ type: LOGOUT });
  dispatch(setAlert('Logged out successfully.', 'info'));
};

// Update Driver Profile & Account Credentials
export const updateAccountProfile = (formData) => async (dispatch) => {
  try {
    const res = await api.put('/users/profile', formData);

    dispatch({
      type: USER_UPDATED,
      payload: res.data.user
    });

    if (res.data.profile) {
      dispatch({
        type: UPDATE_PROFILE,
        payload: res.data.profile
      });
    }

    dispatch(setAlert('Driver profile updated successfully!', 'success'));
    return { success: true };
  } catch (err) {
    const errors = err.response?.data?.errors;
    const msg = err.response?.data?.msg;

    if (errors) {
      errors.forEach((error) => dispatch(setAlert(error.msg, 'danger')));
    } else if (msg) {
      dispatch(setAlert(msg, 'danger'));
    } else {
      dispatch(setAlert('Failed to update driver profile.', 'danger'));
    }

    return {
      success: false,
      error: errors ? errors[0]?.msg : msg || 'Update failed'
    };
  }
};

