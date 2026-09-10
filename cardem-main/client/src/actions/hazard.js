import api from '../utils/api';
import audioService from '../utils/audioService';
import socketService from '../utils/socketService';
import { setAlert } from './alert';
import {
  GET_NEARBY_ALERTS,
  GET_RECENT_ALERTS,
  ALERT_REPORTED,
  ALERT_CONFIRMED,
  ALERT_DISMISSED,
  INCOMING_HAZARD_WARNING,
  ALERT_ERROR
} from './types';

// Get road hazard alerts near current location
export const getNearbyAlerts = (lat, lng, radius = 15000) => async (dispatch) => {
  try {
    const res = await api.get(`/alerts/nearby?lat=${lat}&lng=${lng}&radius_meters=${radius}`);

    dispatch({
      type: GET_NEARBY_ALERTS,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: ALERT_ERROR,
      payload: { msg: err.response?.statusText }
    });
  }
};

// Get recent alerts
export const getRecentAlerts = (coords) => async (dispatch) => {
  try {
    const url = coords && coords.lat && coords.lng
      ? `/alerts/recent?lat=${coords.lat}&lng=${coords.lng}`
      : '/alerts/recent';
    const res = await api.get(url);

    dispatch({
      type: GET_RECENT_ALERTS,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: ALERT_ERROR,
      payload: { msg: err.response?.statusText }
    });
  }
};

// Seed realistic Waze/Google Maps alerts around user's location
export const seedSampleAlerts = (coords) => async (dispatch) => {
  try {
    const res = await api.post('/alerts/seed', coords || {});
    dispatch({
      type: GET_RECENT_ALERTS,
      payload: res.data
    });
    dispatch(setAlert('Waze-style driver alerts seeded successfully!', 'success'));
  } catch (err) {
    dispatch({
      type: ALERT_ERROR,
      payload: { msg: err.response?.statusText }
    });
  }
};

// Report a new road hazard or speed trap
export const reportHazard = (alertData, convoyId = null) => async (dispatch) => {
  try {
    const res = await api.post('/alerts', alertData);

    dispatch({
      type: ALERT_REPORTED,
      payload: res.data
    });

    dispatch(setAlert(`Alert reported: ${res.data.title || res.data.alert_type}`, 'success'));

    // Broadcast in real-time to active convoy members
    if (convoyId) {
      socketService.broadcastHazard(convoyId, res.data);
    }
  } catch (err) {
    const errors = err.response?.data?.errors;
    if (errors) {
      errors.forEach((error) => dispatch(setAlert(error.msg, 'danger')));
    }
    dispatch({
      type: ALERT_ERROR,
      payload: { msg: err.response?.statusText }
    });
  }
};

// Driver confirms alert
export const confirmHazardAlert = (alertId) => async (dispatch) => {
  try {
    const res = await api.post(`/alerts/${alertId}/confirm`);

    dispatch({
      type: ALERT_CONFIRMED,
      payload: res.data
    });

    dispatch(setAlert('Hazard verified. Thanks for helping the convoy!', 'success', 2500));
  } catch (err) {
    dispatch({
      type: ALERT_ERROR,
      payload: { msg: err.response?.statusText }
    });
  }
};

// Driver reports alert is cleared
export const dismissHazardAlert = (alertId) => async (dispatch) => {
  try {
    const res = await api.post(`/alerts/${alertId}/dismiss`);

    dispatch({
      type: ALERT_DISMISSED,
      payload: res.data
    });

    dispatch(setAlert('Reported as cleared.', 'info', 2500));
  } catch (err) {
    dispatch({
      type: ALERT_ERROR,
      payload: { msg: err.response?.statusText }
    });
  }
};

// Real-time incoming hazard warning received from Socket.io
export const receiveIncomingHazard = (alertData) => (dispatch) => {
  audioService.playHazardChime();

  dispatch({
    type: INCOMING_HAZARD_WARNING,
    payload: alertData
  });

  const title = alertData.alert?.title || alertData.alert?.alert_type?.toUpperCase().replace(/_/g, ' ') || 'ROAD HAZARD';
  dispatch(setAlert(`⚠️ WARNING: ${title} reported ahead!`, 'danger', 7000));
};
