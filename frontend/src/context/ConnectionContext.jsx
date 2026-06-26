import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";

const ConnectionContext = createContext(null);
const STORAGE_KEY = "weatherStation.connection";

const DEFAULT_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function ConnectionProvider({ children }) {
  const saved = loadSaved();

  const [mode, setMode] = useState(saved?.mode || "cloud"); // "cloud" | "local"
  const [backendUrl, setBackendUrl] = useState(saved?.backendUrl || DEFAULT_BACKEND_URL);
  const [esp32Ip, setEsp32Ip] = useState(saved?.esp32Ip || "");
  const [esp32Connected, setEsp32Connected] = useState(false);
  const [esp32Error, setEsp32Error] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, backendUrl, esp32Ip }));
  }, [mode, backendUrl, esp32Ip]);

  const baseUrl = mode === "local" && esp32Ip ? `http://${esp32Ip}` : backendUrl;

  /** Ping the ESP32's /data endpoint directly to confirm it's reachable. */
  const connectToEsp32 = useCallback(async (ip) => {
    setChecking(true);
    setEsp32Error(null);
    try {
      const target = ip || esp32Ip;
      const res = await axios.get(`http://${target}/data`, { timeout: 4000 });
      if (res.data) {
        setEsp32Connected(true);
        setEsp32Ip(target);
        setMode("local");
        return true;
      }
      throw new Error("Empty response");
    } catch (e) {
      setEsp32Connected(false);
      setEsp32Error(
        e.code === "ECONNABORTED"
          ? "Timed out reaching that IP. Check the device is on and on the same network."
          : "Couldn't reach the ESP32 at that address."
      );
      return false;
    } finally {
      setChecking(false);
    }
  }, [esp32Ip]);

  const switchToCloud = useCallback(() => setMode("cloud"), []);

  const value = {
    mode,
    setMode,
    backendUrl,
    setBackendUrl,
    esp32Ip,
    setEsp32Ip,
    esp32Connected,
    esp32Error,
    checking,
    connectToEsp32,
    switchToCloud,
    baseUrl,
  };

  return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>;
}

export function useConnection() {
  const ctx = useContext(ConnectionContext);
  if (!ctx) throw new Error("useConnection must be used within ConnectionProvider");
  return ctx;
}
