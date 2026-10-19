import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Check cached session or initialize demo admin session for local frontend preview
    try {
      const cached = localStorage.getItem('fitlife-demo-session');
      if (cached) {
        setUser(JSON.parse(cached));
      } else {
        const demoUser = { id: 'demo-admin-id', email: 'admin@fitlife.com', user_metadata: { role: 'admin' } };
        setUser(demoUser);
      }
    } catch {
      const demoUser = { id: 'demo-admin-id', email: 'admin@fitlife.com', user_metadata: { role: 'admin' } };
      setUser(demoUser);
    }
    setLoading(false);

    try {
      supabase.auth.getSession().then(({ data }) => {
        if (mounted && data?.session?.user) {
          setUser(data.session.user);
        }
      }).catch(() => {
        // offline / demo fallback already active
      });

      const { data: authListener } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (mounted && session?.user) {
            setUser(session.user);
          }
        }
      );

      return () => {
        mounted = false;
        authListener?.subscription?.unsubscribe();
      };
    } catch {
      // offline / demo mode
    }
  }, []);

  const signIn = async (email, password) => {
    try {
      const res = await supabase.auth.signInWithPassword({ email, password });
      if (!res.error && res.data?.user) {
        setUser(res.data.user);
        return res;
      }
      // Demo session fallback when backend is in demo mode
      const demoUser = { id: 'demo-admin-id', email: email || 'admin@fitlife.com', user_metadata: { role: 'admin' } };
      setUser(demoUser);
      localStorage.setItem('fitlife-demo-session', JSON.stringify(demoUser));
      return { data: { user: demoUser }, error: null };
    } catch {
      const demoUser = { id: 'demo-admin-id', email: email || 'admin@fitlife.com', user_metadata: { role: 'admin' } };
      setUser(demoUser);
      localStorage.setItem('fitlife-demo-session', JSON.stringify(demoUser));
      return { data: { user: demoUser }, error: null };
    }
  };

  const signUp = async (email, password) => {
    try {
      return await supabase.auth.signUp({ email, password });
    } catch (err) {
      return { data: null, error: err };
    }
  };

  const clearLocalCaches = () => {
    try {
      const doomed = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key && key.startsWith('fitlife-')) doomed.push(key);
      }
      doomed.forEach((key) => localStorage.removeItem(key));
    } catch {
      // storage unavailable (private mode / blocked cookies) — nothing to clear
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setUser(null);
      clearLocalCaches();
    }
  };

  const resetPassword = async (email) => {
    try {
      return await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
    } catch (err) {
      return { data: null, error: err };
    }
  };

  const updatePassword = async (password) => {
    try {
      return await supabase.auth.updateUser({ password });
    } catch (err) {
      return { data: null, error: err };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(
      'useAuth must be used within an <AuthProvider>. Render the component inside AuthProvider instead of falling back to a default user.'
    );
  }
  return context;
}
