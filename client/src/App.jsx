import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import Login from './components/Login.jsx';
import StudentDashboard from './components/StudentDashboard.jsx';
import TeacherDashboard from './components/TeacherDashboard.jsx'; 
// Import Profile if you created it, otherwise comment this out
import Profile from './components/Profile.jsx'; 
import { useAuth } from './hooks/useAuth.jsx';

// --- PROTECTED ROUTE (Requires Login) ---
function ProtectedRoute({ children, allowedRole }) {
  const { user, token, isLoading } = useAuth();

  // 1. Still loading? Show spinner
  if (isLoading) {
    return <div style={{textAlign: 'center', marginTop: '50px', color: '#666'}}>Loading User Data...</div>;
  }

  // 2. Not logged in? Go to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 3. Logged in but User Data missing? (Safety Net)
  if (!user) {
    return <div style={{textAlign: 'center', marginTop: '50px', color: '#666'}}>Authenticating...</div>;
  }

  // 4. Role Check
  if (allowedRole && user.role !== allowedRole) {
    // Redirect to their correct dashboard if they are in the wrong place
    if (user.role === 'teacher') return <Navigate to="/dashboard" replace />;
    if (user.role === 'student') return <Navigate to="/check-in" replace />;
  }

  return children;
}

// --- PUBLIC ROUTE (Only for Guests) ---
// This fixes the "Redirect Race Condition" on the login page
function PublicRoute({ children }) {
  const { user, token, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  // If logged in, force them to their dashboard immediately
  if (token && user) {
    if (user.role === 'teacher') return <Navigate to="/dashboard" replace />;
    if (user.role === 'student') return <Navigate to="/check-in" replace />;
  }

  return children;
}

function App() {
  const { user, token, logout, isLoading } = useAuth();

  if (isLoading) {
    return <div style={{textAlign: 'center', marginTop: '50px'}}>Loading Application...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        
        {/* --- LOGIN ROUTE (Use PublicRoute Wrapper) --- */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />

        {/* --- TEACHER DASHBOARD --- */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRole="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          } 
        />

        {/* --- STUDENT PORTAL --- */}
        <Route 
          path="/check-in" 
          element={
            <ProtectedRoute allowedRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          } 
        />

        {/* --- STUDENT PROFILE --- */}
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute allowedRole="student">
              <Profile /> 
            </ProtectedRoute>
          } 
        />

        {/* --- ROOT/DEFAULT --- */}
        {/* If token exists, let PublicRoute/ProtectedRoute handle it. If not, go to login. */}
        <Route 
          path="*" 
          element={ <Navigate to="/login" replace /> } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;