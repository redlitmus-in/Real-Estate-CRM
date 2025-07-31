import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './store/authStore';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/auth/Login';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { CompanyManagement } from './pages/admin/CompanyManagement';
import { AllUsers } from './pages/admin/AllUsers';
import { SystemAnalytics } from './pages/admin/SystemAnalytics';
import { Security } from './pages/admin/Security';
import { SystemSettings } from './pages/admin/SystemSettings';
import { Dashboard } from './pages/company/Dashboard';
import { UserManagement } from './pages/company/UserManagement';
import { CustomerManagement } from './pages/company/CustomerManagement';
import { LeadManagement } from './pages/company/LeadManagement';
import { PropertyManagement } from './pages/company/PropertyManagement';
import { PropertyForm } from './pages/company/PropertyForm';
import { MessagingCenter } from './pages/company/MessagingCenter';
import { Analytics } from './pages/company/Analytics';
import { Settings } from './pages/company/Settings';
import { Profile } from './pages/company/Profile';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      onSuccess: (data, query) => {
        console.log('Query success:', query.queryKey, data);
      },
      onError: (error, query) => {
        console.error('Query error:', query.queryKey, error);
      },
    },
  },
});

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ 
  children, 
  adminOnly = false 
}) => {
  const { isAuthenticated, isAdmin } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// Public Route Component (redirect if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to={isAdmin ? "/admin/dashboard" : "/dashboard"} replace />;
  }
  
  return <>{children}</>;
};

// Root redirect component
const RootRedirect: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to={isAdmin ? "/admin/dashboard" : "/dashboard"} replace />;
  }
  
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <Routes>
            {/* Root Route */}
            <Route path="/" element={<RootRedirect />} />
            
            {/* Public Routes */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            
            {/* Protected Routes with Layout */}
            <Route 
              path="/*" 
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              {/* Admin Routes */}
              <Route 
                path="admin/dashboard" 
                element={
                  <ProtectedRoute adminOnly>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="admin/companies" 
                element={
                  <ProtectedRoute adminOnly>
                    <CompanyManagement />
                  </ProtectedRoute>
                } 
              />
              
              {/* Company Routes */}
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="customers" element={<CustomerManagement />} />
              <Route path="leads" element={<LeadManagement />} />
              <Route path="properties" element={<PropertyManagement />} />
              <Route path="properties/new" element={<PropertyForm />} />
              <Route path="properties/edit/:id" element={<PropertyForm />} />
              <Route path="messages" element={<MessagingCenter />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings" element={<Settings />} />
              <Route path="profile" element={<Profile />} />
              
              {/* Admin Routes */}
              <Route 
                path="admin/users" 
                element={
                  <ProtectedRoute adminOnly>
                    <AllUsers />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="admin/analytics" 
                element={
                  <ProtectedRoute adminOnly>
                    <SystemAnalytics />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="admin/security" 
                element={
                  <ProtectedRoute adminOnly>
                    <Security />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="admin/settings" 
                element={
                  <ProtectedRoute adminOnly>
                    <SystemSettings />
                  </ProtectedRoute>
                } 
              />
            </Route>
          </Routes>
          
          {/* Toast notifications */}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;