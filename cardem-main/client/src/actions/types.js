// Action Types Ledger for Cardem Mobile Fullstack System

// Global Alerts
export const SET_ALERT = 'SET_ALERT';
export const REMOVE_ALERT = 'REMOVE_ALERT';

// Auth Pipeline
export const REGISTER_SUCCESS = 'REGISTER_SUCCESS';
export const REGISTER_FAIL = 'REGISTER_FAIL';
export const USER_LOADED = 'USER_LOADED';
export const AUTH_ERROR = 'AUTH_ERROR';
export const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
export const LOGIN_FAIL = 'LOGIN_FAIL';
export const LOGOUT = 'LOGOUT';
export const ACCOUNT_DELETED = 'ACCOUNT_DELETED';

// Profile & Garage
export const GET_PROFILE = 'GET_PROFILE';
export const GET_PROFILES = 'GET_PROFILES';
export const UPDATE_PROFILE = 'UPDATE_PROFILE';
export const CLEAR_PROFILE = 'CLEAR_PROFILE';
export const PROFILE_ERROR = 'PROFILE_ERROR';
export const VEHICLE_ADDED = 'VEHICLE_ADDED';
export const VEHICLE_DELETED = 'VEHICLE_DELETED';
export const VEHICLE_PRIMARY_SET = 'VEHICLE_PRIMARY_SET';

// Convoy & Live Map Telemetry
export const GET_CONVOYS = 'GET_CONVOYS';
export const GET_CONVOY = 'GET_CONVOY';
export const CONVOY_CREATED = 'CONVOY_CREATED';
export const CONVOY_JOINED = 'CONVOY_JOINED';
export const CONVOY_LEFT = 'CONVOY_LEFT';
export const CONVOY_STATUS_UPDATED = 'CONVOY_STATUS_UPDATED';
export const TELEMETRY_UPDATED = 'TELEMETRY_UPDATED';
export const PARTICIPANT_LOCATION_RECEIVED = 'PARTICIPANT_LOCATION_RECEIVED';
export const DRIVER_JOINED_CONVOY = 'DRIVER_JOINED_CONVOY';
export const DRIVER_LEFT_CONVOY = 'DRIVER_LEFT_CONVOY';
export const CLEAR_CONVOY = 'CLEAR_CONVOY';
export const CONVOY_ERROR = 'CONVOY_ERROR';

// Walkie-Talkie Push-to-Talk Voice
export const SET_PTT_ACTIVE = 'SET_PTT_ACTIVE';
export const SET_ACTIVE_SPEAKER = 'SET_ACTIVE_SPEAKER';
export const CLEAR_ACTIVE_SPEAKER = 'CLEAR_ACTIVE_SPEAKER';
export const PTT_ERROR = 'PTT_ERROR';

// Hazard & Police Alerts
export const GET_NEARBY_ALERTS = 'GET_NEARBY_ALERTS';
export const GET_RECENT_ALERTS = 'GET_RECENT_ALERTS';
export const ALERT_REPORTED = 'ALERT_REPORTED';
export const ALERT_CONFIRMED = 'ALERT_CONFIRMED';
export const ALERT_DISMISSED = 'ALERT_DISMISSED';
export const INCOMING_HAZARD_WARNING = 'INCOMING_HAZARD_WARNING';
export const ALERT_ERROR = 'ALERT_ERROR';

// Drive Statistics & Leaderboards
export const GET_CONVOY_LEADERBOARD = 'GET_CONVOY_LEADERBOARD';
export const GET_GLOBAL_LEADERBOARD = 'GET_GLOBAL_LEADERBOARD';
export const GET_MY_STATS = 'GET_MY_STATS';
export const STATS_SUBMITTED = 'STATS_SUBMITTED';
export const STATS_ERROR = 'STATS_ERROR';
