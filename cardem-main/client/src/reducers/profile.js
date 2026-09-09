import {
  GET_PROFILE,
  PROFILE_ERROR,
  CLEAR_PROFILE,
  UPDATE_PROFILE,
  GET_PROFILES,
  VEHICLE_ADDED,
  VEHICLE_DELETED,
  VEHICLE_PRIMARY_SET
} from '../actions/types';

const initialState = {
  profile: null,
  profiles: [],
  loading: true,
  error: {}
};

export default function profileReducer(state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case GET_PROFILE:
    case UPDATE_PROFILE:
    case VEHICLE_ADDED:
    case VEHICLE_DELETED:
    case VEHICLE_PRIMARY_SET:
      return {
        ...state,
        profile: payload,
        loading: false
      };
    case GET_PROFILES:
      return {
        ...state,
        profiles: payload,
        loading: false
      };
    case PROFILE_ERROR:
      return {
        ...state,
        error: payload,
        loading: false
      };
    case CLEAR_PROFILE:
      return {
        ...state,
        profile: null,
        loading: false
      };
    default:
      return state;
  }
}
