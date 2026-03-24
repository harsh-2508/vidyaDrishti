import { Routes, Route, Navigate } from 'react-router-dom';
import Login            from './components/Login.jsx';
import StudentDashboard from './components/StudentDashboard.jsx';
import TeacherDashboard from './components/TeacherDashboard.jsx';
import Profile          from './components/Profile.jsx';
import PredictForm      from './components/PredictForm.jsx';
import DropoutDashboard from './components/Dashboard.jsx';
import { useAuth }      from './hooks/useAuth.jsx';

// --- COMPONENT: PROTECTED ROUTE ---
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, token, isLoading } = useAuth();

  if (isLoading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading User Data...</div>;
  if (!token)    return <Navigate to="/login" replace />;
  if (!user)     return <div style={{ textAlign: 'center', marginTop: '50px' }}>Authenticating...</div>;

  if (allowedRole && user.role !== allowedRole) {
    if (user.role === 'student') return <Navigate to="/check-in" replace />;
    if (user.role === 'teacher') return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// --- COMPONENT: PUBLIC ROUTE ---
const PublicRoute = ({ children }) => {
  const { user, token, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  if (token && user) {
    if (user.role === 'teacher') return <Navigate to="/dashboard" replace />;
    if (user.role === 'student') return <Navigate to="/check-in" replace />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={
        <PublicRoute><Login /></PublicRoute>
      } />

      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Teacher routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRole="teacher">
          <TeacherDashboard />
        </ProtectedRoute>
      } />

      {/* Dropout prediction — teacher only */}
      <Route path="/dropout-predict" element={
        <ProtectedRoute allowedRole="teacher">
          <PredictForm />
        </ProtectedRoute>
      } />

      <Route path="/dropout-records" element={
        <ProtectedRoute allowedRole="teacher">
          <DropoutDashboard />
        </ProtectedRoute>
      } />

      {/* Student routes */}
      <Route path="/check-in" element={
        <ProtectedRoute allowedRole="student">
          <StudentDashboard />
        </ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute allowedRole="student">
          <Profile />
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
