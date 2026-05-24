import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { TOKEN_KEY, authApi } from "../services/api";

const USER_KEY = "fairsplit_user";

const AuthContext = createContext(null);

function getStoredUser() {
  try {
    const rawUser = localStorage.getItem(USER_KEY);
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => getStoredUser());
  const [authLoading, setAuthLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const persistSession = useCallback((session) => {
    localStorage.setItem(TOKEN_KEY, session.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));
    setToken(session.access_token);
    setUser(session.user);
  }, []);

  const login = useCallback(
    async (payload) => {
      const session = await authApi.login(payload);
      persistSession(session);
      return session.user;
    },
    [persistSession],
  );

  const signup = useCallback(
    async (payload) => {
      const session = await authApi.signup(payload);
      persistSession(session);
      return session.user;
    },
    [persistSession],
  );

  const completeExternalSession = useCallback(
    (session) => {
      persistSession(session);
      return session.user;
    },
    [persistSession],
  );

  const refreshProfile = useCallback(async () => {
    const profile = await authApi.me();
    localStorage.setItem(USER_KEY, JSON.stringify(profile));
    setUser(profile);
    return profile;
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function bootstrapProfile() {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      if (!savedToken) {
        if (isMounted) setAuthLoading(false);
        return;
      }

      try {
        const profile = await authApi.me();
        if (isMounted) {
          setToken(savedToken);
          setUser(profile);
          localStorage.setItem(USER_KEY, JSON.stringify(profile));
        }
      } catch {
        if (isMounted) logout();
      } finally {
        if (isMounted) setAuthLoading(false);
      }
    }

    bootstrapProfile();
    return () => {
      isMounted = false;
    };
  }, [logout]);

  const value = useMemo(
    () => ({
      token,
      user,
      authLoading,
      login,
      signup,
      completeExternalSession,
      logout,
      refreshProfile,
    }),
    [token, user, authLoading, login, signup, completeExternalSession, logout, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
