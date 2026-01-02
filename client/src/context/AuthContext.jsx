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

      // 3. Fetch user data IMMEDIATELY so we know the role
      const userResponse = await api.get('/auth/me');
      const userData = userResponse.data.data.user;
      
      setUser(userData);
      
      // 4. Return the ROLE so the Login component knows where to redirect
      return { success: true, role: userData.role }; 

    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: error.response?.data?.message || 'Login failed' };
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