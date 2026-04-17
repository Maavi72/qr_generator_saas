import { createContext, useState, useEffect } from 'react';
import api from '../utils/axiosInstance';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const fetchUser = async (currentToken) => {
    if (!currentToken) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('accounts/me/');
      setUser(res.data);
    } catch (err) {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser(token);
  }, [token]);

  const login = async (username, password) => {
    const res = await api.post('login/', { username, password });
    localStorage.setItem('token', res.data.access);
    setToken(res.data.access);
    await fetchUser(res.data.access);
  };

  const register = async (username, email, password) => {
    await api.post('register/', { username, email, password });
    // Automatically log in after registration
    await login(username, password);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const upgradeToPro = async () => {
    try {
      const res = await api.post('payment/create-checkout/', { origin: window.location.origin });
      window.location.href = res.data.checkout_url;
    } catch (err) {
      alert('Payment session failed. Please ensure your Stripe keys are fully configured.');
    }
  };

  const confirmUpgrade = async () => {
    const res = await api.post('accounts/confirm-upgrade/');
    if (res.data.is_pro) {
      setUser((prev) => (prev ? { ...prev, is_pro: true } : null));
    }
    return res.data;
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, upgradeToPro, confirmUpgrade, api, loading, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}