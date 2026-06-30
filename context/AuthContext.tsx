'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthUser {
  token: string;
  userId: number;
  name: string;
  email: string;
  role: string;
  photoUrl?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (u: AuthUser) => void;
  logout: () => void;
  updateUser: (patch: Partial<AuthUser>) => void;
  openModal: (view?: 'login' | 'register') => void;
  closeModal: () => void;
  modalOpen: boolean;
  modalInitialView: 'login' | 'register';
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
  openModal: () => {},
  closeModal: () => {},
  modalOpen: false,
  modalInitialView: 'login',
});

const STORAGE_KEY = 'user_auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialView, setModalInitialView] = useState<'login' | 'register'>('login');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const login = (u: AuthUser) => {
    setUser(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const updateUser = (patch: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const openModal = (view: 'login' | 'register' = 'login') => {
    setModalInitialView(view);
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, openModal, closeModal, modalOpen, modalInitialView }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
