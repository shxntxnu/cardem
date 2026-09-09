import { combineReducers } from 'redux';
import alert from './alert';
import auth from './auth';
import profile from './profile';
import convoy from './convoy';
import hazard from './hazard';
import stats from './stats';

export default combineReducers({
  alert,
  auth,
  profile,
  convoy,
  hazard,
  stats
});
