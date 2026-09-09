import api from '../utils/api';
import { setAlert } from './alert';
import {
  GET_PROFILE,
  PROFILE_ERROR,
  UPDATE_PROFILE,
  CLEAR_PROFILE,
  ACCOUNT_DELETED
} from './types';

// Get current driver's profile & garage
export const getCurrentProfile = () => async (dispatch) => {
  try {
    const res = await api.get('/profile/me');

    dispatch({
      type: GET_PROFILE,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: PROFILE_ERROR,
      payload: { msg: err.response?.statusText, status: err.response?.status }
    });
  }
};

// Create or update driver profile
export const createProfile = (formData, navigate, edit = false) => async (dispatch) => {
  try {
    const res = await api.post('/profile', formData);

    dispatch({
      type: GET_PROFILE,
      payload: res.data
    });

    dispatch(setAlert(edit ? 'Profile Updated' : 'Driver Profile Created', 'success'));

    if (!edit && navigate) {
      navigate('/dashboard');
    }
  } catch (err) {
    const errors = err.response?.data?.errors;

    if (errors) {
      errors.forEach((error) => dispatch(setAlert(error.msg, 'danger')));
    }

    dispatch({
      type: PROFILE_ERROR,
      payload: { msg: err.response?.statusText, status: err.response?.status }
    });
  }
};

// Add vehicle (car or bike) to garage
export const addVehicle = (formData, navigate) => async (dispatch) => {
  try {
    const res = await api.put('/profile/garage', formData);

    dispatch({
      type: UPDATE_PROFILE,
      payload: res.data
    });

    dispatch(setAlert('Vehicle successfully parked in your garage!', 'success'));
    if (navigate) {
      navigate('/dashboard');
    }
  } catch (err) {
    const errors = err.response?.data?.errors;

    if (errors) {
      errors.forEach((error) => dispatch(setAlert(error.msg, 'danger')));
    }

    dispatch({
      type: PROFILE_ERROR,
      payload: { msg: err.response?.statusText, status: err.response?.status }
    });
  }
};

// Set vehicle as primary ride
export const setPrimaryVehicle = (vehicleId) => async (dispatch) => {
  try {
    const res = await api.put(`/profile/garage/${vehicleId}/primary`);

    dispatch({
      type: UPDATE_PROFILE,
      payload: res.data
    });

    dispatch(setAlert('Active primary ride updated!', 'success'));
  } catch (err) {
    dispatch({
      type: PROFILE_ERROR,
      payload: { msg: err.response?.statusText, status: err.response?.status }
    });
  }
};

// Delete vehicle from garage
export const deleteVehicle = (vehicleId) => async (dispatch) => {
  try {
    const res = await api.delete(`/profile/garage/${vehicleId}`);

    dispatch({
      type: UPDATE_PROFILE,
      payload: res.data
    });

    dispatch(setAlert('Vehicle removed from garage', 'info'));
  } catch (err) {
    dispatch({
      type: PROFILE_ERROR,
      payload: { msg: err.response?.statusText, status: err.response?.status }
    });
  }
};

// Delete driver account & all associated telemetry/garage data
export const deleteAccount = () => async (dispatch) => {
  if (window.confirm('Are you sure you want to delete your account? This CANNOT be undone!')) {
    try {
      await api.delete('/profile');

      dispatch({ type: CLEAR_PROFILE });
      dispatch({ type: ACCOUNT_DELETED });

      dispatch(setAlert('Your account has been permanently removed', 'info'));
    } catch (err) {
      dispatch({
        type: PROFILE_ERROR,
        payload: { msg: err.response?.statusText, status: err.response?.status }
      });
    }
  }
};
