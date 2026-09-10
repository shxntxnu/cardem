import api from '../utils/api';
import { setAlert } from './alert';
import {
  GET_PROFILE,
  PROFILE_ERROR,
  UPDATE_PROFILE,
  CLEAR_PROFILE,
  ACCOUNT_DELETED,
  GET_FRIENDS,
  FRIEND_ADDED,
  FRIEND_REMOVED,
  GET_FRIEND_DETAILS,
  CLEAR_FRIEND_DETAILS,
  FRIEND_ERROR
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
    const msg = err.response?.data?.msg;

    if (errors) {
      errors.forEach((error) => dispatch(setAlert(error.msg, 'danger')));
    } else if (msg) {
      dispatch(setAlert(msg, 'danger'));
    } else {
      dispatch(setAlert('Failed to add vehicle to garage', 'danger'));
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

// Get list of connected fleet friends
export const getFriends = () => async (dispatch) => {
  try {
    const res = await api.get('/profile/friends');

    dispatch({
      type: GET_FRIENDS,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: FRIEND_ERROR,
      payload: { msg: err.response?.statusText, status: err.response?.status }
    });
  }
};

// Add friend by unique code (e.g. CRD-XXXXXX)
export const addFriendByCode = (friendCode) => async (dispatch) => {
  try {
    const res = await api.post('/profile/friends/add', { friend_code: friendCode });

    dispatch({
      type: FRIEND_ADDED,
      payload: res.data.friend
    });

    dispatch(setAlert(res.data.msg || 'Driver added to your fleet friends!', 'success'));
    return { success: true, friend: res.data.friend };
  } catch (err) {
    const errors = err.response?.data?.errors;
    const msg = err.response?.data?.msg;

    if (errors) {
      errors.forEach((error) => dispatch(setAlert(error.msg, 'danger')));
    } else if (msg) {
      dispatch(setAlert(msg, 'danger'));
    } else {
      dispatch(setAlert('Failed to connect with driver', 'danger'));
    }

    dispatch({
      type: FRIEND_ERROR,
      payload: { msg: err.response?.statusText, status: err.response?.status }
    });
    return { success: false, error: msg || 'Failed to add friend' };
  }
};

// Remove friend by user ID
export const removeFriend = (friendUserId) => async (dispatch) => {
  try {
    await api.delete(`/profile/friends/${friendUserId}`);

    dispatch({
      type: FRIEND_REMOVED,
      payload: friendUserId
    });

    dispatch(setAlert('Friend removed from fleet', 'info'));
  } catch (err) {
    dispatch({
      type: FRIEND_ERROR,
      payload: { msg: err.response?.statusText, status: err.response?.status }
    });
  }
};

// Get a friend's full read-only profile, fleet garage, and driving statistics
export const getFriendDetails = (friendUserId) => async (dispatch) => {
  try {
    const [profileRes, statsRes] = await Promise.all([
      api.get(`/profile/friends/${friendUserId}`),
      api.get(`/stats/user/${friendUserId}`)
    ]);

    dispatch({
      type: GET_FRIEND_DETAILS,
      payload: {
        profile: profileRes.data,
        stats: statsRes.data
      }
    });
  } catch (err) {
    const msg = err.response?.data?.msg || 'Could not load friend details';
    dispatch(setAlert(msg, 'danger'));
    dispatch({
      type: FRIEND_ERROR,
      payload: { msg: err.response?.statusText, status: err.response?.status }
    });
  }
};

// Clear active selected friend
export const clearFriendDetails = () => (dispatch) => {
  dispatch({ type: CLEAR_FRIEND_DETAILS });
};

