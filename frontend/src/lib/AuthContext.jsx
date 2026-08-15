import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  // Kept for interface compatibility with the old base44 app-bootstrap flow;
  // there's no separate "public settings" fetch against our own backend, so
  // this resolves immediately.
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings] = useState(null);

  const checkUserAuth = useCallback(async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      if (error.status === 401 || error.status === 403) {
        setAuthError({ type: 'auth_required', message: 'Authentication required' });
      } else if (error.status) {
        setAuthError({ type: 'unknown', message: error.message });
      }
      // No session at all (status undefined) is the normal logged-out state, not an error.
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, []);

  // checkAppState is kept for interface compatibility with ProtectedRoute/App.jsx,
  // which call it on mount the same way they called it against base44.
  const checkAppState = useCallback(() => checkUserAuth(), [checkUserAuth]);

  useEffect(() => {
    checkUserAuth();

    // base44.auth._onAuthStateChanged fires whenever base44Client.js saves/clears
    // a session (login, register w/ immediate session, OTP verify, refresh, logout).
    const unsubscribe = base44.auth._onAuthStateChanged(() => {
      checkUserAuth();
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    base44.auth.logout(shouldRedirect ? '/login' : undefined);
  };

  const navigateToLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
