import {
  GET_CONVOY_LEADERBOARD,
  GET_GLOBAL_LEADERBOARD,
  GET_MY_STATS,
  STATS_SUBMITTED,
  STATS_ERROR
} from '../actions/types';

const initialState = {
  convoyLeaderboard: null,
  globalLeaderboard: null,
  myStats: null,
  loading: true,
  error: {}
};

export default function statsReducer(state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case GET_CONVOY_LEADERBOARD:
      return {
        ...state,
        convoyLeaderboard: payload,
        loading: false
      };
    case GET_GLOBAL_LEADERBOARD:
      return {
        ...state,
        globalLeaderboard: payload,
        loading: false
      };
    case GET_MY_STATS:
      return {
        ...state,
        myStats: payload,
        loading: false
      };
    case STATS_SUBMITTED:
      return {
        ...state,
        loading: false
      };
    case STATS_ERROR:
      return {
        ...state,
        error: payload,
        loading: false
      };
    default:
      return state;
  }
}
