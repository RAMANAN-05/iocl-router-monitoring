import React, { useState, useEffect } from 'react';
import './Form.css';
import Logo from '../assets/wifi.png';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function VerifyOtp() {
  const [enteredOtp, setEnteredOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [timer, setTimer] = useState(60);
  const [step, setStep] = useState('verify');
  const navigate = useNavigate();

  const email = localStorage.getItem("resetEmail");

  useEffect(() => {
    if (step === 'verify' && timer > 0) {
      const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer, step]);

  const handleVerify = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/verify-otp', {
        email,
        otp: enteredOtp
      });

      if (res.data.success) {
        alert("OTP verified successfully");
        setStep("reset");
      } else {
        alert(res.data.message || "Invalid OTP");
      }
    } catch (err) {
      alert("Server error during OTP verification");
      console.error(err);
    }
  };

  const handlePasswordReset = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/reset-password', {
        email,
        newPassword
      });

      if (res.data.success) {
        alert("Password reset successfully!");
        localStorage.clear();
        navigate("/login");
      } else {
        alert(res.data.message || "Reset failed");
      }
    } catch (err) {
      alert("Server error during password reset");
      console.error(err);
    }
  };

  const handleResend = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/send-otp', {
        email
      });

      if (res.data.success) {
        setTimer(60);
        alert(`New OTP sent to ${email} (Check server log for OTP)`);
      } else {
        alert(res.data.message || "Failed to resend OTP");
      }
    } catch (err) {
      alert("Server error while resending OTP");
      console.error(err);
    }
  };

  return (
    <div className="form-container">
      <img src={Logo} alt="Logo" />
      <form className="form-box" onSubmit={(e) => e.preventDefault()}>
        <h2>{step === 'verify' ? 'Verify OTP' : 'Set New Password'}</h2>

        {step === 'verify' && (
          <>
            <input
              type="text"
              placeholder="Enter OTP"
              value={enteredOtp}
              onChange={(e) => setEnteredOtp(e.target.value)}
              maxLength={6}
              required
            />
            <button className="btn purple" type="button" onClick={handleVerify}>Verify</button>
            <p className="lost">
              {timer > 0 ? `Resend OTP in ${timer}s` : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="resend-otp-btn"
                  style={{
                    cursor: 'pointer',
                    color: '#fff',
                    textDecoration: 'underline',
                    background: 'none',
                    border: 'none',
                    padding: 0
                  }}
                >
                  Resend OTP
                </button>
              )}
            </p>
          </>
        )}

        {step === 'reset' && (
          <>
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <button className="btn purple" type="button" onClick={handlePasswordReset}>Reset Password</button>
          </>
        )}
      </form>
    </div>
  );
}

export default VerifyOtp;
