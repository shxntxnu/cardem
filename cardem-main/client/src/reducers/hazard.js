import {
  GET_NEARBY_ALERTS,
  GET_RECENT_ALERTS,
  ALERT_REPORTED,
  ALERT_CONFIRMED,
  ALERT_DISMISSED,
  INCOMING_HAZARD_WARNING,
  ALERT_ERROR
} from '../actions/types';

const initialState = {
  alerts: [],
  activeWarning: null, // Pop-up banner for proximity warning
  loading: true,
  error: {}
};

export default function hazardReducer(state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case GET_NEARBY_ALERTS:
    case GET_RECENT_ALERTS:
      return {
        ...state,
        alerts: payload,
        loading: false
      };
    case ALERT_REPORTED:
      return {
        ...state,
        alerts: [payload, ...state.alerts],
        loading: false
      };
    case ALERT_CONFIRMED:
    case ALERT_DISMISSED:
      return {
        ...state,
        alerts: state.alerts.map(a => a._id === payload._id ? payload : a),
        loading: false
      };
    case INCOMING_HAZARD_WARNING:
      return {
        ...state,
        activeWarning: payload
      };
    case ALERT_ERROR:
      return {
        ...state,
        error: payload,
        loading: false
      };
    default:
      return state;
  }
}
