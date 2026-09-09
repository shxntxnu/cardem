import { SET_ALERT, REMOVE_ALERT } from './types';

export const setAlert = (msg, alertType, timeout = 4000) => (dispatch) => {
  const id = 'alt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

  dispatch({
    type: SET_ALERT,
    payload: { msg, alertType, id }
  });

  setTimeout(() => dispatch({ type: REMOVE_ALERT, payload: id }), timeout);
};
