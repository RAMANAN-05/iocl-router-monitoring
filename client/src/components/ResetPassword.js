import React, { useState } from 'react';
import './Form.css';
import Logo from '../assets/iocl.png';
import { useNavigate } from 'react-router-dom';

function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const navigate = useNavigate();
  const email = localStorage.getItem("resetEmail");

  const handleReset = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword })
      });

      const data = await res.json();

      if (res.ok) {
        alert("Password has been reset successfully!");
        localStorage.clear();
        navigate("/login");
      } else {
        alert(data.message || "Password reset failed.");
      }
    } catch (err) {
      console.error("Reset error:", err);
      alert("Server error. Try again later.");
    }
  };

  return (
    <div className="form-container">
      <img src={Logo} alt="Logo" />
      <form className="form-box" onSubmit={handleReset}>
        <h2>Set New Password</h2>
        <input
          type="password"
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <button className="btn purple" type="submit">Reset Password</button>
      </form>
    </div>
  );
}

export default ResetPassword;
