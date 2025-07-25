import React, { useEffect, useState, useRef, useCallback } from "react";
import "./DashBoard.css";
import {
  FaArrowUp,
  FaArrowDown,
  FaVolumeMute,
  FaVolumeUp,
  FaSignOutAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const DashBoard = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);

  const prevLocationsRef = useRef([]);
  const audioRef = useRef(new Audio(`${process.env.PUBLIC_URL}/alarm.mp3`));
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);
  const hasAlertedRef = useRef(false);
  const poorStartTimes = useRef({});
  const navigate = useNavigate();

  const detectDroppedConnections = (prev, current) => {
    const dropped = [];
    current.forEach((entry) => {
      const prevEntry = prev.find((p) => p.location === entry.location);
      if (!prevEntry) return;
      const losses = [];
      if (prevEntry.jio === "good" && entry.jio === "poor") losses.push("Jio");
      if (prevEntry.bsnl === "good" && entry.bsnl === "poor") losses.push("BSNL");
      if (losses.length > 0) dropped.push(`${entry.location}: ${losses.join(", ")}`);
    });
    return dropped;
  };

  const checkContinuedPoorStatus = (data) => {
    const now = Date.now();
    const alarms = [];

    data.forEach((entry) => {
      ["jio", "bsnl"].forEach((network) => {
        const key = `${entry.location}-${network}`;
        const status = entry[network];

        if (status === "poor") {
          if (!poorStartTimes.current[key]) {
            poorStartTimes.current[key] = now;
          } else if (now - poorStartTimes.current[key] >= 30 * 60 * 1000) {
            alarms.push(`${entry.location}: ${network.toUpperCase()}`);
          }
        } else {
          delete poorStartTimes.current[key];
        }
      });
    });

    return alarms;
  };

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_BASE || ""}/api/network/status`
      );
      const data = await res.json();
      if (!isMountedRef.current) return;

      const dropped = detectDroppedConnections(prevLocationsRef.current, data);
      const alarms = checkContinuedPoorStatus(data);

      const anyPoor = data.some(
        (entry) => entry.jio === "poor" || entry.bsnl === "poor"
      );

      if ((dropped.length > 0 || alarms.length > 0) && !isMuted) {
        if (!hasAlertedRef.current) {
          audioRef.current.loop = true;
          audioRef.current.currentTime = 0;
          audioRef.current.play().then(() => setIsAlarmPlaying(true))
            .catch((err) => console.warn("Audio play error:", err));
          hasAlertedRef.current = true;

          const alertMessage = [
            dropped.length > 0 ? `Signal dropped:\n${dropped.join("\n")}` : null,
            alarms.length > 0 ? `30min poor status:\n${alarms.join("\n")}` : null,
          ].filter(Boolean).join("\n\n");

          alert("⚠️ " + alertMessage);
        }
      } else if (!anyPoor) {
        hasAlertedRef.current = false;
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsAlarmPlaying(false);
      }

      prevLocationsRef.current = data;
      setLocations(data);
      setLoading(false);
    } catch (err) {
      console.error("❌ Error fetching status", err);
    }
  }, [isMuted]);

  useEffect(() => {
    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, 1000);    // time
    return () => {
      clearInterval(intervalRef.current);
      isMountedRef.current = false;
    };
  }, [fetchStatus]);

  const handleMuteToggle = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (next) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsAlarmPlaying(false);
      } else {
        const dropped = detectDroppedConnections(prevLocationsRef.current, locations);
        const alarms = checkContinuedPoorStatus(locations);
        if (dropped.length > 0 || alarms.length > 0) {
          audioRef.current.loop = true;
          audioRef.current.currentTime = 0;
          audioRef.current.play().then(() => setIsAlarmPlaying(true))
            .catch((err) => console.warn("Audio play error:", err));
        }
      }
      return next;
    });
  };

  const handleLogout = () => {
    isMountedRef.current = false;
    clearInterval(intervalRef.current);
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    localStorage.removeItem("token");
    navigate("/login");
  };

  const renderArrow = (status) =>
    status?.toLowerCase() === "good" ? (      //changed this line lastly
      <FaArrowUp className="arrow green" />
    ) : (
      <FaArrowDown className="arrow red" />
    );

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>IOCL Network Status</h1>
        <div className="header-buttons">
          <button onClick={handleMuteToggle} title={isMuted ? "Unmute Alarm" : "Mute Alarm"}>
            {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
          </button>
          <button onClick={handleLogout} title="Logout">
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </header>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="grid-container">
          {locations.map((loc, index) => (
            <div className="grid-box" key={`${loc.location}-${index}`}>
              <div className="location-name">{loc.location}</div>
              <div className="status-line">
                <span>Jio:</span> {renderArrow(loc.jio)}
              </div>
              <div className="status-line">
                <span>BSNL:</span> {renderArrow(loc.bsnl)}
              </div>
            </div>
          ))}
        </div>
      )}

      {isAlarmPlaying && !isMuted && (
        <div className="alarm-status">🔔 Alarm Active</div>
      )}
    </div>
  );
};

export default DashBoard;