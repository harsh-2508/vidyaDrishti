import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import Login from "./components/Login.jsx";
import StudentDashboard from "./components/StudentDashboard.jsx"; // Make sure this is imported
import TeacherDashboard from "./components/TeacherDashboard.jsx";
import { useAuth } from "./hooks/useAuth.jsx";
import Profile from "./components/Profile.jsx";

// 1. Protected Route Component
function ProtectedRoute({ children, allowedRole }) {
  const { user, token, isLoading } = useAuth();

  // If we are still checking the token, show a loading text
  if (isLoading) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        Loading User Data...
      </div>
    );
  }

  // If no token or no user, go to login
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // If role doesn't match, show warning
  if (allowedRole && user.role !== allowedRole) {
    return <div>Access Denied. You are logged in as a {user.role}.</div>;
  }

  return children;
}

// ... imports

function App() {
  const { user, token, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        Loading Application...
      </div>
    );
  }

  return (
    <BrowserRouter>
      {/* REMOVED .app-container and .content-card wrappers */}

      {/* Optional: Simple Nav for testing, can be removed since Dashboard has its own sidebar */}
      {/* {token && (
        <nav style={{position: 'absolute', top: 10, right: 10, zIndex: 9999}}>
           <button onClick={logout}>Logout (Debug)</button>
        </nav>
      )} 
      */}

      <Routes>
        {/* Public Route */}
        <Route
          path="/login"
          element={
            !token ? (
              <Login />
            ) : (
              <Navigate
                to={user?.role === "teacher" ? "/dashboard" : "/check-in"}
              />
            )
          }
        />

        {/* Teacher Route */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRole="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />

        {/* Student Route */}
        <Route
          path="/check-in"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        {/* Default Redirect */}
        <Route
          path="*"
          element={
            <Navigate
              to={
                token
                  ? user?.role === "teacher"
                    ? "/dashboard"
                    : "/check-in"
                  : "/login"
              }
            />
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRole="student">
              <Profile />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
