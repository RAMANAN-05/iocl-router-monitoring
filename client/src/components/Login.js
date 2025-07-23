import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./Form.css";
import Logo from "../assets/wifi.png";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(localStorage.getItem("rememberedEmail") || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(Boolean(localStorage.getItem("rememberedEmail")));

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("✅ Login successful");

      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      navigate("/dashboard");
    } catch (error) {
      alert("❌ Login failed: " + error.message);
      console.error(error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      alert("✅ Google login successful");
      navigate("/dashboard");
    } catch (error) {
      alert("❌ Google login failed: " + error.message);
      console.error(error);
    }
  };

  return (
    <div className="form-container">
      <img src={Logo} alt="Logo" className="logo-img" />
      <form className="form-box" onSubmit={handleLogin}>
        <h2>Login</h2>

        <div className="input-wrapper">
          <input
            type="email"
            placeholder="Email ID"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="eye-icon"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword(!showPassword)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setShowPassword(!showPassword);
              }
            }}
            tabIndex={0}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        <div className="remember-forgot">
          <label>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />{" "}
            Remember Me
          </label>
          <Link to="/forgot-password">Forgot Password?</Link>
        </div>

        <div className="btn-group">
          <button className="btn purple" type="submit">
            Login
          </button>
          <Link to="/signup">
            <button type="button" className="btn gray">
              Sign Up
            </button>
          </Link>
        </div>

        <div className="divider">or</div>

        <button type="button" className="btn google" onClick={handleGoogleLogin}>
          Sign in with Google
        </button>
      </form>
    </div>
  );
}

export default Login;
