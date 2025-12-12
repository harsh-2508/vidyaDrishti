import { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios.js';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [isLoading, setIsLoading] = useState(true);
  

  useEffect(() => {
    // Check for user data on initial load
    const fetchUser = async () => {
      if (token) {
        try {
          const response = await api.get('/auth/me');
          setUser(response.data.data.user);
        } catch (error) {
          // Token is invalid
          console.error('Failed to fetch user', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    fetchUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      // 1. Log in
      const response = await api.post('/auth/login', { email, password });
      const { token } = response.data;

      // 2. Set token
      setToken(token);
      localStorage.setItem('token', token);

      // 3. Fetch user data
      const userResponse = await api.get('/auth/me');
      setUser(userResponse.data.data.user);
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  // Wait to render children until we've checked for a user
  if (isLoading) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};