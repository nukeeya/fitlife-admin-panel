import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { fetchStaffProfile } from '../lib/supabaseData';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Staff profile (public.users row + role). null = signed in but no active
  // role yet — the database grants such accounts no access at all.
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const applySession = async (session) => {
      const nextUser = session?.user ?? null;
      let nextStaff = null;
      if (nextUser) {
        const { data, error } = await fetchStaffProfile(nextUser.id);
        if (error) console.error('[AuthContext] staff profile load failed:', error.message);
        nextStaff = data;
      }
      if (!mounted) return;
      setUser(nextUser);
      setStaff(nextStaff);
      setLoading(false);
    };

    supabase.auth.getSession()
      .then(({ data }) => applySession(data?.session))
      .catch((err) => {
        console.error('[AuthContext] getSession failed:', err);
        if (mounted) setLoading(false);
      });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      // Defer: supabase-js warns against awaiting other supabase calls inside this callback.
      setTimeout(() => applySession(session), 0);
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    try {
      return await supabase.auth.signInWithPassword({ email, password });
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
      setStaff(null);
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
    <AuthContext.Provider value={{ user, staff, loading, signIn, signOut, resetPassword, updatePassword }}>
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
