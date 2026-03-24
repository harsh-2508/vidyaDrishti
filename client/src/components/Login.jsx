import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useNavigate } from 'react-router-dom';
import './Login.css'; // Ensure you have basic CSS

function Login() {
  const [email, setEmail] = useState('amit@school.com'); // Default for easy testing
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await login(email, password);
      
      if (result.success) {
        // Explicit Navigation based on Role
        if (result.role === 'teacher') {
          navigate('/dashboard');
        } else {
          navigate('/check-in');
        }
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrapper" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f4f6f8'}}>
      <div className="auth-card" style={{background: 'white', padding: '40px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px'}}>
        <form onSubmit={handleSubmit}>
          <h2 style={{textAlign: 'center', marginBottom: '20px', color: '#2c3e50'}}>VidyaDrishti Login</h2>
          
          <div style={{marginBottom: '15px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd'}}
            />
          </div>

          <div style={{marginBottom: '20px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd'}}
            />
          </div>

          {error && <p style={{color: '#e74c3c', fontSize: '14px', textAlign: 'center', marginBottom: '15px'}}>{error}</p>}

          <button type="submit" disabled={isLoading} style={{width: '100%', padding: '12px', background: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'}}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;