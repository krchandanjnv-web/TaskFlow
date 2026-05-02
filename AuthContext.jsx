import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

const USER_KEY  = "tf_user";
const TOKEN_KEY = "tf_token";

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      const token  = localStorage.getItem(TOKEN_KEY);
      if (stored && token) setUser(JSON.parse(stored));
    } catch {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    localStorage.setItem(TOKEN_KEY, token);
    setUser(userData);
  };

  const signOut = () => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  const getToken = () => localStorage.getItem(TOKEN_KEY);

  return (
    <AuthContext.Provider value={{ user, loading, login, signOut, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
