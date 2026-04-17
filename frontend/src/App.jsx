import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import GenerateQR from './pages/GenerateQR';
import Success from './pages/Success';
import Cancel from './pages/Cancel';
import TestPage from './pages/TestPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Public routes without navbar */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* All other pages with Navbar */}
            <Route
              path="/*"
              element={
                <>
                  <Navbar />
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/generate" element={<ProtectedRoute><GenerateQR /></ProtectedRoute>} />
                    <Route path="/success" element={<ProtectedRoute><Success /></ProtectedRoute>} />
                    <Route path="/cancel" element={<ProtectedRoute><Cancel /></ProtectedRoute>} />
                    <Route path="/test" element={<TestPage />} />
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </>
              }
            />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;