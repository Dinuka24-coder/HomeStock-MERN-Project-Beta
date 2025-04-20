import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import './App.css'; // Main Styles
import Register from './pages/Register';
import Login from './pages/Login';
import Home from "./pages/Home";
import Inventory from "./pages/Inventory";
import Expenses from './pages/Expenses';
import React, { useEffect, useState } from 'react';


const AppWrapper = () => {
  const location = useLocation(); // Get the current route location
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Track login status

  
  useEffect(() => {
    const token = localStorage.getItem("userToken");
    setIsAuthenticated(!!token);
  }, [location.pathname]); 

  return (
    <div className="App">
      
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />

        {/* Private Routes (Require Authentication) */}
        
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/expenses" element={<Expenses />} />
      </Routes>

      
    </div>
  );
};


function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}

export default App;


//Fixed some errors where the footer is not rendering properly on some pages