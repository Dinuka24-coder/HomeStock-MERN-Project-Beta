import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./../styles/login.css";
import { FaLock } from "react-icons/fa"; // Optional icon

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

  // Handle login form submission
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
        alert("Login successful!");
        localStorage.setItem("userToken", data.token);
        navigate("/home");
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Something went wrong. Please try again.");
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
      <form onSubmit={handleLogin}>
        <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
        <button type="submit">Login</button>
      </form>
      <p>
        <a href="/forgot-password">Forgot Password?</a>
      </p>
      <p>Don't have an account? <Link to="/register">Register here</Link></p>
    </div>
  );
}

export default Login;

//Google auth is completed