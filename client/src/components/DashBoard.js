import React, { useEffect, useState, useRef, useCallback } from "react";
import "./DashBoard.css";
import {
  FaArrowUp,
  FaArrowDown,
  FaVolumeMute,
  FaVolumeUp,
  FaSignOutAlt,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const DashBoard = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const prevLocationsRef = useRef([]);
  const audioRef = useRef(new Audio(`${process.env.PUBLIC_URL}/alarm.mp3`));
  const timeoutRef = useRef(null);
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);
  const hasAlertedRef = useRef(new Set());
  const poorStartTimes = useRef({});
  const navigate = useNavigate();

  // Cleanup function for poorStartTimes
  const cleanupPoorStartTimes = useCallback((currentLocations) => {
    const currentKeys = new Set();
    currentLocations.forEach(entry => {
      ["jio", "bsnl"].forEach(network => {
        currentKeys.add(`${entry.location}-${network}`);
      });
    });

    Object.keys(poorStartTimes.current).forEach(key => {
      if (!currentKeys.has(key)) {
        delete poorStartTimes.current[key];
      }
    });
  }, []);

  const detectDroppedConnections = useCallback((prev, current) => {
    if (!prev || prev.length === 0) return [];
    
    const dropped = [];
    current.forEach((entry) => {
      const prevEntry = prev.find((p) => p.location === entry.location);
      if (!prevEntry) return;
      
      const losses = [];
      if (prevEntry.jio === "good" && entry.jio === "poor") losses.push("Jio");
      if (prevEntry.bsnl === "good" && entry.bsnl === "poor") losses.push("BSNL");
      
      if (losses.length > 0) {
        dropped.push(`${entry.location}: ${losses.join(", ")}`);
      }
    });
    return dropped;
  }, []);

  const checkContinuedPoorStatus = useCallback((data) => {
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
  }, []);

  const playAlarm = useCallback(async () => {
    if (isMuted) return;
    
    try {
      audioRef.current.loop = true;
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
      setIsAlarmPlaying(true);
    } catch (err) {
      console.warn("Audio play error:", err);
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Network Alert', {
          body: 'Network connectivity issues detected',
          icon: '/favicon.ico'
        });
      }
    }
  }, [isMuted]);

  const stopAlarm = useCallback(() => {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsAlarmPlaying(false);
  }, []);

  const scheduleNextFetch = useCallback((delayMs, fetchFunction) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      if (isMountedRef.current && fetchFunction) {
        fetchFunction();
      }
    }, delayMs);
  }, []);

  const performNetworkRequest = useCallback(async () => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    const timeoutId = setTimeout(() => {
      if (controller === abortControllerRef.current) {
        controller.abort();
      }
    }, 15000);
    
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_BASE || ""}/api/network/status`,
        { 
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      clearTimeout(timeoutId);
      
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      return await res.json();
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }, []);

  const handleAlerts = useCallback(async (dropped, alarms) => {
    const alertKey = [...dropped, ...alarms].join("|");
    const shouldAlert = (dropped.length > 0 || alarms.length > 0) && 
                       !hasAlertedRef.current.has(alertKey) && 
                       !isMuted;

    if (!shouldAlert) return;

    hasAlertedRef.current.add(alertKey);
    await playAlarm();

    const alertMessage = [
      dropped.length > 0 ? `Signal dropped:\n${dropped.join("\n")}` : null,
      alarms.length > 0 ? `30min poor status:\n${alarms.join("\n")}` : null,
    ].filter(Boolean).join("\n\n");

    alert("⚠️ " + alertMessage);
  }, [isMuted, playAlarm]);

  const handleFetchSuccess = useCallback((data, fetchStatusCallback) => {
    cleanupPoorStartTimes(data);
    
    const dropped = detectDroppedConnections(prevLocationsRef.current, data);
    const alarms = checkContinuedPoorStatus(data);
    
    handleAlerts(dropped, alarms);
    
    const anyPoor = data.some(
      (entry) => entry.jio === "poor" || entry.bsnl === "poor"
    );
    
    if (!anyPoor) {
      hasAlertedRef.current.clear();
      stopAlarm();
    }

    prevLocationsRef.current = data;
    setLocations(data);
    setLoading(false);
    setLastUpdate(new Date());
    setRetryCount(0);
    
    scheduleNextFetch(300000, fetchStatusCallback);
  }, [cleanupPoorStartTimes, detectDroppedConnections, checkContinuedPoorStatus, 
      handleAlerts, stopAlarm, scheduleNextFetch]);

  const handleFetchError = useCallback((err, fetchStatusCallback) => {
    if (abortControllerRef.current) {
      abortControllerRef.current = null;
    }
    
    if (err.name === 'AbortError') {
      console.log('🔄 Fetch request was aborted (timeout or new request)');
      return;
    }
    
    console.error("❌ Error fetching status", err);
    
    if (!isMountedRef.current) return;
    
    setError(err.message);
    setRetryCount(prev => {
      const newCount = prev + 1;
      const retryDelay = Math.min(60000, 5000 * Math.pow(2, newCount));
      scheduleNextFetch(retryDelay, fetchStatusCallback);
      return newCount;
    });
    
    if (locations.length === 0) {
      setLoading(false);
    }
  }, [scheduleNextFetch, locations.length]);

  const fetchStatus = useCallback(async () => {
    if (!isMountedRef.current) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    try {
      setError(null);
      const data = await performNetworkRequest();
      
      if (!isMountedRef.current) return;
      
      handleFetchSuccess(data, fetchStatus);
    } catch (err) {
      handleFetchError(err, fetchStatus);
    }
  }, [performNetworkRequest, handleFetchSuccess, handleFetchError]);

  useEffect(() => {
    const currentHasAlerted = hasAlertedRef.current;
    
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    fetchStatus();
    
    return () => {
      const currentTimeout = timeoutRef.current;
      const currentController = abortControllerRef.current;
      
      if (currentTimeout) clearTimeout(currentTimeout);
      if (currentController) currentController.abort();
      isMountedRef.current = false;
      stopAlarm();
      currentHasAlerted.clear();
      // Clear poorStartTimes by resetting the ref
      poorStartTimes.current = {};
    };
  }, [fetchStatus, stopAlarm]);

  useEffect(() => {
    if (!loading && !error && locations.length > 0) {
      const currentTimeout = timeoutRef.current;
      if (currentTimeout) {
        clearTimeout(currentTimeout);
        scheduleNextFetch(300000, fetchStatus);
      }
    }
  }, [fetchStatus, scheduleNextFetch, loading, error, locations.length]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      } else if (isMountedRef.current) {
        fetchStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchStatus]);

  const handleMuteToggle = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (next) {
        stopAlarm();
      } else {
        const dropped = detectDroppedConnections(prevLocationsRef.current, locations);
        const alarms = checkContinuedPoorStatus(locations);
        if (dropped.length > 0 || alarms.length > 0) {
          playAlarm();
        }
      }
      return next;
    });
  }, [stopAlarm, detectDroppedConnections, checkContinuedPoorStatus, locations, playAlarm]);

  const handleLogout = useCallback(() => {
    isMountedRef.current = false;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    stopAlarm();
    localStorage.removeItem("token");
    navigate("/login");
  }, [navigate, stopAlarm]);

  const handleRetry = useCallback(() => {
    setError(null);
    setRetryCount(0);
    fetchStatus();
  }, [fetchStatus]);

  const renderArrow = (status) =>
    status?.toLowerCase() === "good" ? (
      <FaArrowUp className="arrow green" />
    ) : (
      <FaArrowDown className="arrow red" />
    );

  const formatLastUpdate = (date) => {
    if (!date) return '';
    return date.toLocaleString('en-IN', {
      hour12: true,
      timeStyle: 'medium',
      dateStyle: 'short',
    });
  };

  const getGridBoxClass = (loc) => {
    if (loc.jio === 'poor' && loc.bsnl === 'poor') {
      return 'grid-box critical';
    }
    if (loc.jio === 'poor' || loc.bsnl === 'poor') {
      return 'grid-box warning';
    }
    return 'grid-box good';
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>IOCL Network Status</h1>
        <div className="header-info">
          {lastUpdate && (
            <div className="last-update">
              Last Updated: {formatLastUpdate(lastUpdate)}
            </div>
          )}
          {error && (
            <div className="error-status">
              <FaExclamationTriangle /> Connection Error
              <button onClick={handleRetry} className="retry-btn">
                Retry
              </button>
            </div>
          )}
        </div>
        <div className="header-buttons">
          <button 
            onClick={handleMuteToggle} 
            title={isMuted ? "Unmute Alarm" : "Mute Alarm"}
            className={isMuted ? "muted" : ""}
          >
            {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
          </button>
          <button onClick={handleLogout} title="Logout">
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </header>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          Loading network status...
        </div>
      ) : (
        <div className="grid-container">
          {locations.map((loc, index) => (
            <div 
              className={getGridBoxClass(loc)}
              key={`${loc.location}-${index}`}
            >
              <div className="location-name">{loc.location}</div>
              <div className="status-line">
                <span>Jio:</span> {renderArrow(loc.jio)}
                <span className="status-text">{loc.jio}</span>
              </div>
              <div className="status-line">
                <span>BSNL:</span> {renderArrow(loc.bsnl)}
                <span className="status-text">{loc.bsnl}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {isAlarmPlaying && !isMuted && (
        <div className="alarm-status">
          🔔 Alarm Active - Click mute to silence
        </div>
      )}

      {retryCount > 0 && (
        <div className="retry-indicator">
          Retrying... (Attempt {retryCount})
        </div>
      )}
    </div>
  );
};

export default DashBoard;