import axios from 'axios';

// // 1. Set the base URL for all requests
// const api = axios.create({
//   baseURL: 'http://localhost:4000/api', // Your backend URL
// });

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, 
  withCredentials: true 
});


// 2. The magic: An interceptor to add the token to every request
api.interceptors.request.use(
  (config) => {
    // 3. Get the token from local storage
    const token = localStorage.getItem('token');
    
    // 4. If the token exists, add it to the Authorization header
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
