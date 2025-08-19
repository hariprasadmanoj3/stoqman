import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth, ProtectedRoute } from './utils/auth';

// Import pages (we'll create these next)
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Billing from './pages/Billing';
import Reports from './pages/Reports';

// Import layout
import Navbar from './components/layout/Navbar';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public route */}
          <Route 
            path="/login" 
            element={
              auth.isAuthenticated() ? 
              <Navigate to="/dashboard" replace /> : 
              <Login />
            } 
          />
          
          {/* Protected routes */}
          <Route path="/*" element={
            <ProtectedRoute>
              <Navbar />
              <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/billing" element={<Billing />} />
                  <Route path="/reports" element={
                    (auth.getUser()?.role || '').toLowerCase() === 'admin' ? <Reports /> : <Navigate to="/dashboard" replace />
                  } />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </main>
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;