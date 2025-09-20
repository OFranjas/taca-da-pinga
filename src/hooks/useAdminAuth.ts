import { useCallback, useEffect, useState } from 'react';
import { signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { auth } from '../firebase';

type UseAdminAuthResult = {
  user: User | null;
  email: string;
  password: string;
  isCheckingAuth: boolean;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};

export function useAdminAuth(): UseAdminAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((nextUser) => {
      setUser(nextUser);
      setIsCheckingAuth(false);
    });

    return unsubscribe;
  }, []);

  const login = useCallback(async () => {
    await signInWithEmailAndPassword(auth, email, password);
  }, [email, password]);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  return {
    user,
    email,
    password,
    isCheckingAuth,
    setEmail,
    setPassword,
    login,
    logout,
  };
}
