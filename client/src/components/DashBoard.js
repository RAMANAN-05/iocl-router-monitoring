import React, { useEffect, useState, useRef, useCallback } from "react";
import "./DashBoard.css";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";

const alarmSound = new Audio("/alarm.mp3");
const BASE_URL = "https://iocl-backend.onrender.com"; // ✅ Backend URL

const DashBoard = () => {
  const [statusList, setStatusList] = useState([]);
  const isMountedRef = useRef(true);
  const [mute, setMute] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/network/status`, {
        method: 'GET',
        mode: 'cors', // ✅ Required for cross-origin
      });

      const data = await res.json();
      if (!isMountedRef.current) return;

      const newStatus = data.map(item => ({
        ...item,
        jioGood: item.jio === "good",
        bsnlGood: item.bsnl === "good",
      }));

      const alarmNeeded = newStatus.some(
        (item) => !item.jioGood || !item.bsnlGood
      );

      if (alarmNeeded && !mute) {
        alarmSound.loop = true;
        alarmSound.play();
      } else {
        alarmSound.pause();
        alarmSound.currentTime = 0;
      }

      setStatusList(newStatus);
    } catch (err) {
      console.error("Error fetching status", err);
    }
  }, [mute]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 1000);

    return () => {
      clearInterval(interval);
      isMountedRef.current = false;
    };
  }, [fetchStatus]);

  return (
    <div className="dashboard">
      <h1>📡 IOCL Network Monitoring</h1>
      <button onClick={() => setMute(!mute)} className="mute-btn">
        {mute ? "🔇 Unmute" : "🔊 Mute"}
      </button>
      <table>
        <thead>
          <tr>
            <th>Location</th>
            <th>Jio</th>
            <th>BSNL</th>
            <th>Last Updated</th>
          </tr>
        </thead>
        <tbody>
          {statusList.map((item, idx) => (
            <tr key={idx}>
              <td>{item.location}</td>
              <td className={item.jioGood ? "good" : "bad"}>
                {item.jioGood ? <FaArrowUp /> : <FaArrowDown />}
              </td>
              <td className={item.bsnlGood ? "good" : "bad"}>
                {item.bsnlGood ? <FaArrowUp /> : <FaArrowDown />}
              </td>
              <td>{new Date(item.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DashBoard;
