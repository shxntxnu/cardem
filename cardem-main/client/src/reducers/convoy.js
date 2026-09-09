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
  CLEAR_CONVOY,
  CONVOY_ERROR,
  SET_PTT_ACTIVE,
  SET_ACTIVE_SPEAKER,
  CLEAR_ACTIVE_SPEAKER
} from '../actions/types';

const initialState = {
  convoys: [],
  activeConvoy: null,
  myTelemetry: {
    lat: 0,
    lng: 0,
    speed_kph: 0,
    heading: 0,
    altitude: 0
  },
  isTransmittingPTT: false,
  activeSpeaker: null, // { speakerName, vehicle, isSpeaking }
  loading: true,
  error: {}
};

export default function convoyReducer(state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case GET_CONVOYS:
      return {
        ...state,
        convoys: payload,
        loading: false
      };
    case GET_CONVOY:
    case CONVOY_CREATED:
    case CONVOY_JOINED:
    case CONVOY_STATUS_UPDATED:
      return {
        ...state,
        activeConvoy: payload,
        loading: false
      };
    case TELEMETRY_UPDATED:
      return {
        ...state,
        myTelemetry: payload
      };
    case PARTICIPANT_LOCATION_RECEIVED: {
      if (!state.activeConvoy) return state;

      const { userId, telemetry, vehicle, driverName } = payload;
      let participantFound = false;

      const updatedParticipants = (state.activeConvoy.participants || []).map(p => {
        const pUserId = p.user?._id || p.user?.id || p.user;
        if (pUserId && pUserId.toString() === userId?.toString()) {
          participantFound = true;
          return {
            ...p,
            current_location: telemetry,
            last_active: new Date()
          };
        }
        return p;
      });

      if (!participantFound && userId) {
        updatedParticipants.push({
          user: { _id: userId, name: driverName },
          vehicle: vehicle || { make: 'Vehicle', model: 'Ride' },
          current_location: telemetry,
          last_active: new Date()
        });
      }

      return {
        ...state,
        activeConvoy: {
          ...state.activeConvoy,
          participants: updatedParticipants
        }
      };
    }
    case DRIVER_JOINED_CONVOY: {
      if (!state.activeConvoy) return state;
      const exists = state.activeConvoy.participants.some(
        p => (p.user?._id || p.user) === (payload.user?.id || payload.user?._id)
      );
      if (exists) return state;

      return {
        ...state,
        activeConvoy: {
          ...state.activeConvoy,
          participants: [...state.activeConvoy.participants, payload]
        }
      };
    }
    case DRIVER_LEFT_CONVOY: {
      if (!state.activeConvoy) return state;
      return {
        ...state,
        activeConvoy: {
          ...state.activeConvoy,
          participants: state.activeConvoy.participants.filter(
            p => (p.user?._id || p.user) !== payload.userId
          )
        }
      };
    }
    case SET_PTT_ACTIVE:
      return {
        ...state,
        isTransmittingPTT: payload
      };
    case SET_ACTIVE_SPEAKER:
      return {
        ...state,
        activeSpeaker: payload
      };
    case CLEAR_ACTIVE_SPEAKER:
      return {
        ...state,
        activeSpeaker: null
      };
    case CONVOY_LEFT:
    case CLEAR_CONVOY:
      return {
        ...state,
        activeConvoy: null,
        loading: false
      };
    case CONVOY_ERROR:
      return {
        ...state,
        error: payload,
        loading: false
      };
    default:
      return state;
  }
}
