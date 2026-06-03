import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("cs_token");
    const storedUser = localStorage.getItem("cs_user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  function persistAuth(payload) {
    localStorage.setItem("cs_token", payload.token);
    localStorage.setItem("cs_user", JSON.stringify(payload.user));
    setToken(payload.token);
    setUser(payload.user);
  }

  async function register(values) {
    const { data } = await api.post("/auth/register", values);
    return data;
  }

  async function login(values) {
    const { data } = await api.post("/auth/login", values);
    persistAuth(data);
    return data;
  }

  function logout() {
    localStorage.removeItem("cs_token");
    localStorage.removeItem("cs_user");
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, token, isAuthenticated: Boolean(token), register, login, logout }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
