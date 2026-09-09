import api from '../utils/api';
import { setAlert } from './alert';
import {
  GET_CONVOY_LEADERBOARD,
  GET_GLOBAL_LEADERBOARD,
  GET_MY_STATS,
  STATS_SUBMITTED,
  STATS_ERROR
} from './types';

// Submit drive statistics for completed session
export const submitDriveStats = (convoyId, statsData) => async (dispatch) => {
  try {
    const res = await api.post(`/stats/convoy/${convoyId}`, statsData);

    dispatch({
      type: STATS_SUBMITTED,
      payload: res.data
    });

    dispatch(setAlert(`Drive logged! Safety score: ${res.data.safety_score}/100`, 'success', 5000));
  } catch (err) {
    dispatch({
      type: STATS_ERROR,
      payload: { msg: err.response?.statusText }
    });
  }
};

// Get leaderboard for specific convoy
export const getConvoyLeaderboard = (convoyId) => async (dispatch) => {
  try {
    const res = await api.get(`/stats/convoy/${convoyId}/leaderboard`);

    dispatch({
      type: GET_CONVOY_LEADERBOARD,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: STATS_ERROR,
      payload: { msg: err.response?.statusText }
    });
  }
};

// Get global all-time leaderboards
export const getGlobalLeaderboard = () => async (dispatch) => {
  try {
    const res = await api.get('/stats/global/leaderboard');

    dispatch({
      type: GET_GLOBAL_LEADERBOARD,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: STATS_ERROR,
      payload: { msg: err.response?.statusText }
    });
  }
};

// Get personal drive history & summary metrics
export const getMyStats = () => async (dispatch) => {
  try {
    const res = await api.get('/stats/me');

    dispatch({
      type: GET_MY_STATS,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: STATS_ERROR,
      payload: { msg: err.response?.statusText }
    });
  }
};
