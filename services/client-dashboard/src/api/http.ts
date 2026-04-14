import axios from 'axios';

const http = axios.create({
  baseURL: 'http://localhost:8000', // Kong API Gateway
});

export function setAuthToken(token: string | null) {
  if (token) {
    http.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete http.defaults.headers.common['Authorization'];
  }
}

export default http;
