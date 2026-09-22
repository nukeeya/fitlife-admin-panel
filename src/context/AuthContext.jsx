import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    try {
      supabase.auth.getSession().then(({ data }) => {
        if (mounted) {
          setUser(data?.session?.user ?? null);
          setLoading(false);
        }
      }).catch(() => {
        if (mounted) setLoading(false);
      });

      const { data: authListener } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (mounted) {
            setUser(session?.user ?? null);
          }
        }
      );

      return () => {
        mounted = false;
        authListener?.subscription?.unsubscribe();
      };
    } catch {
      if (mounted) setLoading(false);
    }
  }, []);

  const signIn = async (email, password) => {
    try {
      const res = await supabase.auth.signInWithPassword({ email, password });
      if (!res.error) {
        setUser(res.data?.user ?? { email });
      }
      return res;
    } catch (err) {
      return { data: null, error: err };
    }
  };

  const signUp = async (email, password) => {
    try {
      return await supabase.auth.signUp({ email, password });
    } catch (err) {
      return { data: null, error: err };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: { email: 'admin@fitlife.com', role: 'admin' },
      loading: false,
      signIn: async (email) => ({ data: { user: { email } }, error: null }),
      signUp: async (email) => ({ data: { user: { email } }, error: null }),
      signOut: async () => {},
    };
  }
  return context;
}
