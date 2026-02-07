import { createContext, useContext, useState, useEffect } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth as firebaseAuth } from '../firebase';
import api from '../api';

const AuthContext = createContext(null);

const googleProvider = new GoogleAuthProvider();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      api.get('/auth/me')
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.clear();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('access_token', res.data.access_token);
    localStorage.setItem('refresh_token', res.data.refresh_token);
    setUser(res.data.user);
    return res.data.user;
  };

  const signup = async (data) => {
    const res = await api.post('/auth/signup', data);
    return res.data;
  };

  const googleLogin = async () => {
    const result = await signInWithPopup(firebaseAuth, googleProvider);
    const idToken = await result.user.getIdToken();
    const res = await api.post('/auth/firebase', { token: idToken });
    localStorage.setItem('access_token', res.data.access_token);
    localStorage.setItem('refresh_token', res.data.refresh_token);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, googleLogin, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
