import React, { useState } from 'react';
import './Form.css';
import Logo from '../assets/iocl.png';
import { useNavigate, Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase'; // Make sure this path is correct

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();

    if (!email?.includes('@') || !email?.includes('.')) {
      alert("❗ Please enter a valid email address");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      alert(`📨 Password reset link sent to ${email}. Please check your inbox.`);
      navigate('/');
    } catch (error) {
      alert("❌ " + (error?.message || "Unknown error"));
      console.error(error);
    }
  };

  return (
    <div className="form-container">
      <img src={Logo} alt="Logo" />
      <form className="form-box" onSubmit={handleReset}>
        <h2>Forgot Password</h2>

        <input 
          type="email" 
          placeholder="Enter your email" 
          required 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button className="btn purple" type="submit">Send Reset Link</button>

        <div style={{ marginTop: '10px' }}>
          <Link to="/" style={{ color: '#555', textDecoration: 'underline' }}>
            ← Back to Login
          </Link>
        </div>
      </form>
    </div>
  );
}

export default ForgotPassword;
