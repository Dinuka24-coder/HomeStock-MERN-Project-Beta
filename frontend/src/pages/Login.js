import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import "./../styles/login.css";
import { FaLock, FaGoogle } from "react-icons/fa";
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  // Handle form field change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle regular login form submission
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:3000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });

      const data = await response.json();
      if (response.ok) {
        Swal.fire({
          title: "Welcome!",
          text: "Login successful!",
          icon: "success",
          confirmButtonText: "OK",
        }).then(() => {
          localStorage.setItem("userToken", data.token);
          navigate("/home");
        });
      } else {
        Swal.fire({
          title: "Error!",
          text: data.message,
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: "Something went wrong. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  // Handle Google login
  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const res = await axios.post('http://localhost:3000/api/auth/google', {
        token: credentialResponse.credential,
      });

      const { accessToken, user } = res.data;

      // Store token and user
      localStorage.setItem("userToken", accessToken);
      localStorage.setItem("user", JSON.stringify(user));

      Swal.fire({
        title: "Welcome!",
        text: "Google login successful!",
        icon: "success",
        confirmButtonText: "OK",
      }).then(() => {
        navigate("/home");
      });
    } catch (err) {
      console.error('Google login failed', err.message);
      Swal.fire({
        title: "Error!",
        text: "Google login failed. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  // Use effect hook to add login-page class to body
  useEffect(() => {
    document.body.classList.add("login-page");

    // Cleanup function to remove the class when leaving the page
    return () => {
      document.body.classList.remove("login-page");
    };
  }, []);

  return (
    <div className="login-container">
      <div className="icon">
        <FaLock />
      </div>
      <h2>Login</h2>
      
      {/* Regular Login Form */}
      <form onSubmit={handleLogin}>
        <input 
          type="email" 
          name="email" 
          placeholder="Email" 
          onChange={handleChange} 
          required 
        />
        <input 
          type="password" 
          name="password" 
          placeholder="Password" 
          onChange={handleChange} 
          required 
        />
        <button type="submit">Login</button>
      </form>

      {/* Divider */}
      <div className="divider">
        <span>OR</span>
      </div>

      {/* Google Login Button */}
      <div className="google-login">
        <GoogleLogin
          onSuccess={handleGoogleLogin}
          onError={() => {
            Swal.fire({
              title: "Error!",
              text: "Google login failed",
              icon: "error",
              confirmButtonText: "OK",
            });
          }}
          theme="filled_blue"
          size="large"
          text="continue_with"
          shape="rectangular"
          width="300"
        />
      </div>

      <p>
        <a href="/forgot-password">Forgot Password?</a>
      </p>
      <p>Don't have an account? <Link to="/register">Register here</Link></p>
    </div>
  );
}

export default Login;