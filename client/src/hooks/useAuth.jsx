import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios.js';

// 1. Create the Context
const AuthContext = createContext(null);

// 2. Create the Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // Check localStorage for token on initial load
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      // If we have a token but no user data, verify it
      if (token && !user) {
        try {
          const response = await api.get('/auth/me'); // Ensure your backend has this route
          setUser(response.data.data.user);
        } catch (error) {
          console.error('Session expired or invalid token', error);
          logout(); // Auto-logout if token is invalid
        }
      }
      setIsLoading(false);
    };

    fetchUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      // Depending on your backend, response.data might contain { token, user } directly
      // Adjust this based on your exact API response structure
      const { token: newToken, user: newUser } = response.data; 

      // If backend only returns token, we set it and fetch user later.
      // If backend returns both, we set both now.
      setToken(newToken);
      localStorage.setItem('token', newToken);
      
      if (newUser) {
        setUser(newUser);
        return { success: true, role: newUser.role };
      } else {
        // Fallback: Fetch user if not provided in login response
        const userRes = await api.get('/auth/me');
        setUser(userRes.data.data.user);
        return { success: true, role: userRes.data.data.user.role };
      }

    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    // Optional: Redirect to login handled by App.jsx routes
  };

  // Prevent app from rendering until we know auth status
  if (isLoading) {
    return <div style={{textAlign: 'center', marginTop: '50px'}}>Loading User Data...</div>;
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Export the Hook
export const useAuth = () => {
  return useContext(AuthContext);
};