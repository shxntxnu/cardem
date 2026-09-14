import {
  GET_CONVOY_LEADERBOARD,
  GET_GLOBAL_LEADERBOARD,
  GET_MY_STATS,
  STATS_SUBMITTED,
  CONVOY_HISTORY_DELETED,
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
    case CONVOY_HISTORY_DELETED:
      return {
        ...state,
        myStats: state.myStats
          ? {
              ...state.myStats,
              history: (state.myStats.history || []).filter((h) => {
                const hConvoyId = (h.convoy?._id || h.convoy)?.toString();
                return hConvoyId !== payload.convoyId && h._id?.toString() !== payload.convoyId;
              }),
              summary: payload.summary || state.myStats.summary
            }
          : null,
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
