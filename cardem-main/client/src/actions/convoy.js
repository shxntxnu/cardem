import api from '../utils/api';
import socketService from '../utils/socketService';
import { setAlert } from './alert';
import {
  GET_CONVOYS,
  GET_CONVOY,
  CONVOY_CREATED,
  CONVOY_JOINED,
  CONVOY_LEFT,
  CONVOY_STATUS_UPDATED,
  TELEMETRY_UPDATED,
  PARTICIPANT_LOCATION_RECEIVED,
  DRIVER_JOINED_CONVOY,
  DRIVER_LEFT_CONVOY,
  CONVOY_ERROR,
  SET_PTT_ACTIVE,
  SET_ACTIVE_SPEAKER,
  CLEAR_ACTIVE_SPEAKER
} from './types';

// Get all active public convoys
export const getActiveConvoys = () => async (dispatch) => {
  try {
    const res = await api.get('/convoys/active');

    dispatch({
      type: GET_CONVOYS,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: CONVOY_ERROR,
      payload: { msg: err.response?.statusText, status: err.response?.status }
    });
  }
};

// Get single convoy details
export const getConvoy = (id) => async (dispatch) => {
  try {
    const res = await api.get(`/convoys/${id}`);

    dispatch({
      type: GET_CONVOY,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: CONVOY_ERROR,
      payload: { msg: err.response?.statusText, status: err.response?.status }
    });
  }
};

// Create a new convoy
export const createConvoy = (formData, navigate) => async (dispatch) => {
  try {
    const res = await api.post('/convoys', formData);

    dispatch({
      type: CONVOY_CREATED,
      payload: res.data
    });

    dispatch(setAlert(`Convoy "${res.data.name}" created! Join Code: ${res.data.join_code}`, 'success', 6000));

    if (navigate) {
      navigate(`/convoy/${res.data._id}`);
    }
  } catch (err) {
    const errors = err.response?.data?.errors;
    if (errors) {
      errors.forEach((error) => dispatch(setAlert(error.msg, 'danger')));
    }
    dispatch({
      type: CONVOY_ERROR,
      payload: { msg: err.response?.statusText, status: err.response?.status }
    });
  }
};

// Join convoy via 6-character code
export const joinConvoyByCode = (joinCode, navigate) => async (dispatch) => {
  try {
    const res = await api.post('/convoys/join', { join_code: joinCode });

    dispatch({
      type: CONVOY_JOINED,
      payload: res.data
    });

    dispatch(setAlert(`Connected to Convoy "${res.data.name}"!`, 'success'));

    if (navigate) {
      navigate(`/convoy/${res.data._id}`);
    }
  } catch (err) {
    const msg = err.response?.data?.msg || 'Could not join convoy';
    dispatch(setAlert(msg, 'danger'));
    dispatch({
      type: CONVOY_ERROR,
      payload: { msg }
    });
  }
};

// Leave convoy
export const leaveConvoy = (convoyId, navigate) => async (dispatch) => {
  try {
    await api.post(`/convoys/${convoyId}/leave`);

    socketService.leaveConvoy(convoyId);

    dispatch({
      type: CONVOY_LEFT
    });

    dispatch(setAlert('Left the convoy', 'info'));

    if (navigate) {
      navigate('/dashboard');
    }
  } catch (err) {
    dispatch({
      type: CONVOY_ERROR,
      payload: { msg: err.response?.statusText }
    });
  }
};

// Update convoy status (e.g. host completes drive)
export const updateConvoyStatus = (convoyId, status) => async (dispatch) => {
  try {
    const res = await api.put(`/convoys/${convoyId}/status`, { status });

    dispatch({
      type: CONVOY_STATUS_UPDATED,
      payload: res.data
    });

    dispatch(setAlert(`Convoy marked as ${status}`, 'info'));
  } catch (err) {
    dispatch({
      type: CONVOY_ERROR,
      payload: { msg: err.response?.statusText }
    });
  }
};

// Update local driver telemetry and dispatch to peers
export const updateTelemetry = (convoyId, telemetry) => (dispatch) => {
  dispatch({
    type: TELEMETRY_UPDATED,
    payload: telemetry
  });

  // Emit via WebSockets
  socketService.sendTelemetry(convoyId, telemetry);
};

// Ingest peer location update received from Socket.io
export const receivePeerLocation = (data) => (dispatch) => {
  dispatch({
    type: PARTICIPANT_LOCATION_RECEIVED,
    payload: data
  });
};

// Peer joined or left events
export const peerJoined = (driverData) => (dispatch) => {
  dispatch({ type: DRIVER_JOINED_CONVOY, payload: driverData });
  dispatch(setAlert(`${driverData.user?.name || 'A driver'} joined the convoy`, 'info', 2500));
};

export const peerLeft = (driverData) => (dispatch) => {
  dispatch({ type: DRIVER_LEFT_CONVOY, payload: driverData });
};

// Walkie-Talkie Push-to-Talk actions
export const setPTTActive = (isActive) => ({
  type: SET_PTT_ACTIVE,
  payload: isActive
});

export const setActiveSpeaker = (speakerData) => ({
  type: SET_ACTIVE_SPEAKER,
  payload: speakerData
});

export const clearActiveSpeaker = () => ({
  type: CLEAR_ACTIVE_SPEAKER
});
