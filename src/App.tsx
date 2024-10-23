import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import { LoginPage } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { CreateQuiz } from './pages/CreateQuiz';
import { EditQuiz } from './pages/EditQuiz';
import { StudentDashboard } from './pages/StudentDashboard';
import { TakeQuiz } from './pages/TakeQuiz';
import { QuizResults } from './pages/QuizResults';

function PrivateRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: 'admin' | 'student' }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.role);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to={role === 'admin' ? '/admin' : '/student'} replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <PrivateRoute requiredRole="admin">
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/create-quiz"
          element={
            <PrivateRoute requiredRole="admin">
              <CreateQuiz />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/quiz/:id"
          element={
            <PrivateRoute requiredRole="admin">
              <EditQuiz />
            </PrivateRoute>
          }
        />

        {/* Student Routes */}
        <Route
          path="/student"
          element={
            <PrivateRoute requiredRole="student">
              <StudentDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/student/quiz/:id"
          element={
            <PrivateRoute requiredRole="student">
              <TakeQuiz />
            </PrivateRoute>
          }
        />
        <Route
          path="/student/results/:id"
          element={
            <PrivateRoute requiredRole="student">
              <QuizResults />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;