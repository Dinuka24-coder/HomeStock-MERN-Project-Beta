import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import './App.css'; // Main Styles
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import AdminDashboard from "./pages/AdminDashboard";
import Inventory from "./pages/Inventory";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyOTP from "./pages/VerifyOTP";
import Expenses from './pages/Expenses';
import ResetPassword from "./pages/ResetPassword";
import Footer from './components/Footer'; // Import Footer
import Header from './components/Header'; // Import Header
import Chatbot from './components/Chatbot';
import React, { useEffect, useState } from 'react';

// ✅ Wrapper Component to Conditionally Render Header & Footer
const AppWrapper = () => {
  const location = useLocation(); // Get the current route location
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Track login status

  // ✅ Check if user is authenticated (exists in localStorage)
  useEffect(() => {
    const token = localStorage.getItem("userToken");
    setIsAuthenticated(!!token);
  }, [location.pathname]); // Re-check on page change

  // ❌ Exclude Header & Footer from these pages
  const excludeHeaderFooterRoutes = ["/", "/forgot-password", "/reset-password"];

  // ✅ Show Header & Footer only if logged in & not on excluded routes
  const shouldShowHeaderFooter = isAuthenticated && !excludeHeaderFooterRoutes.includes(location.pathname);

  return (
    <div className="App">
      {/* ✅ Conditionally Render Header */}
      {shouldShowHeaderFooter && <Header />}

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />

        {/* Private Routes (Require Authentication) */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>

      {/* Render Chatbot on authenticated routes */}
      {isAuthenticated && !excludeHeaderFooterRoutes.includes(location.pathname) && <Chatbot />}

      {/* ✅ Conditionally Render Footer */}
      {shouldShowHeaderFooter && <Footer />}
    </div>
  );
};

// ✅ Main App Component
function App() {
  return (
    <GoogleOAuthProvider clientId="549453271146-arjg9f76kmic2o7tsr4rmo7tipelurul.apps.googleusercontent.com">
      <Router>
        <AppWrapper />
      </Router>
    </GoogleOAuthProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <GoogleOAuthProvider clientId="549453271146-arjg9f76kmic2o7tsr4rmo7tipelurul.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
);

export default App;
