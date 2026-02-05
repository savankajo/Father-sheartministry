import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
};

import Roster from './pages/Roster';
import Events from './pages/Events';
import Teams from './pages/Teams';
import Admin from './pages/Admin';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <ErrorBoundary>
                  <Dashboard />
                </ErrorBoundary>
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/events" element={
            <ProtectedRoute>
              <Layout>
                <ErrorBoundary>
                  <Events />
                </ErrorBoundary>
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/roster" element={
            <ProtectedRoute>
              <Layout>
                <ErrorBoundary>
                  <Roster />
                </ErrorBoundary>
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/teams" element={
            <ProtectedRoute>
              <Layout>
                <ErrorBoundary>
                  <Teams />
                </ErrorBoundary>
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute>
              <Layout>
                <ErrorBoundary>
                  <Admin />
                </ErrorBoundary>
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
