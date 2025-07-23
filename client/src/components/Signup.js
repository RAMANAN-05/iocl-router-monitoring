import React, { useState } from 'react';
import './Form.css';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../assets/wifi.png';
import axios from 'axios';
import { auth } from '../firebase'; // Make sure firebase.js is configured correctly
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!email.includes('@') || !password) {
      alert("Enter valid email and password");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/auth/signup", {
        email,
        password
      });

      if (res.data.success) {
        alert("Signup successful! You can now login.");
        navigate('/login');
      } else {
        alert(res.data.message || "Signup failed");
      }
    } catch (err) {
      alert("Server error during signup");
      console.error(err);
    }
  };

  const handleGoogleSignup = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      alert("Google Sign-Up successful!");
      navigate('/dashboard');
    } catch (error) {
      alert("Google Sign-Up failed: " + error.message);
      console.error(error);
    }
  };

  return (
    <div className="form-container">
      <img src={Logo} alt="Logo" />
      <form className="form-box" onSubmit={handleSignup}>
        <h2>Sign Up</h2>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email ID"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="btn-group">
          <button className="btn purple" type="submit">Sign Up</button>
          <Link to="/login">
            <button type="button" className="btn gray">Sign In</button>
          </Link>
        </div>
        <button type="button" className="btn google" onClick={handleGoogleSignup}>
          Sign Up with Google
        </button>
      </form>
    </div>
  );
}

export default Signup;
