import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate

function Login() {
  const [email, setEmail] = useState('john@student.com'); 
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate(); // 2. Initialize hook

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const success = await login(email, password);
    
    if (success) {
      // 3. Navigate to root (App.jsx will handle the specific redirect based on role)
      navigate('/'); 
    } else {
      setError('Login Failed! Check your email and password.');
    }
    setIsLoading(false);
  };

  return (
    <div className="auth-wrapper"> {/* New Wrapper */}
      <div className="auth-card">  {/* New Card Class */}
        <form onSubmit={handleSubmit}>
          <h2 style={{textAlign: 'center', marginBottom: '20px'}}>Smart Attendance</h2>
          
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

          {error && <p style={{color: 'red', fontSize: '14px'}}>{error}</p>}

          <button type="submit" className="primary-btn" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;