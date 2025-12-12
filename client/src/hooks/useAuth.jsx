// src/hooks/useAuth.jsx

import { useContext } from 'react';
// Make sure to import the context itself from the correct path
import { AuthContext } from '../context/AuthContext.jsx'; 

export const useAuth = () => {
  return useContext(AuthContext);
};