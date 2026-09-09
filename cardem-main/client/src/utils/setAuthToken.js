import axios from 'axios';

// Attaches or detaches JWT token from all outgoing Axios requests
const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['x-auth-token'] = token;
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete axios.defaults.headers.common['x-auth-token'];
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
};

export default setAuthToken;
