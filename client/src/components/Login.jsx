import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('john@student.com'); 
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // 1. Call login and wait for the result
    const result = await login(email, password);
    
    if (result.success) {
      // 2. Check Role and Navigate Explicitly
      if (result.role === 'teacher') {
        navigate('/dashboard'); // Go straight to Teacher Dashboard
      } else {
        navigate('/check-in');  // Go straight to Student Portal
      }
    } else {
      setError(result.error);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <form onSubmit={handleSubmit}>
          <h2 style={{textAlign: 'center', marginBottom: '20px', color: '#333'}}>
            VidyaDrishti Login
          </h2>
          
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
          </div>

          {error && <p style={{color: 'red', fontSize: '14px', textAlign: 'center'}}>{error}</p>}

          <button type="submit" className="primary-btn" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;