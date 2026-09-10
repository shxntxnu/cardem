import {
  GET_PROFILE,
  PROFILE_ERROR,
  CLEAR_PROFILE,
  UPDATE_PROFILE,
  GET_PROFILES,
  VEHICLE_ADDED,
  VEHICLE_DELETED,
  VEHICLE_PRIMARY_SET,
  GET_FRIENDS,
  FRIEND_ADDED,
  FRIEND_REMOVED,
  GET_FRIEND_DETAILS,
  CLEAR_FRIEND_DETAILS,
  FRIEND_ERROR
} from '../actions/types';

const initialState = {
  profile: null,
  profiles: [],
  friends: [],
  selectedFriend: null,
  friendLoading: false,
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
    case GET_FRIENDS:
      return {
        ...state,
        friends: payload,
        friendLoading: false
      };
    case FRIEND_ADDED:
      return {
        ...state,
        friends: [payload, ...state.friends.filter(f => f.user?._id !== payload.user?._id)],
        friendLoading: false
      };
    case FRIEND_REMOVED:
      return {
        ...state,
        friends: state.friends.filter((f) => f.user?._id !== payload && f.user !== payload),
        friendLoading: false
      };
    case GET_FRIEND_DETAILS:
      return {
        ...state,
        selectedFriend: payload,
        friendLoading: false
      };
    case CLEAR_FRIEND_DETAILS:
      return {
        ...state,
        selectedFriend: null,
        friendLoading: false
      };
    case FRIEND_ERROR:
      return {
        ...state,
        error: payload,
        friendLoading: false
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
        friends: [],
        selectedFriend: null,
        loading: false
      };
    default:
      return state;
  }
}
