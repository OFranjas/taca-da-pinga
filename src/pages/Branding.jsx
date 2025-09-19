import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import Header from '../components/Header';
import { auth } from '../firebase';
import BrandingForm from '../components/BrandingForm';
import { getBranding, updateBranding } from '../services/branding.service';
import styles from './Admin.module.css';
import pageStyles from './Branding.module.css';

function useAdminAuth() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUser(u));
    return unsub;
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
    setEmail,
    password,
    setPassword,
    login,
    logout,
  };
}

export default function Branding() {
  const navigate = useNavigate();
  const { user, email, setEmail, password, setPassword, login, logout } = useAdminAuth();
  const [initialData, setInitialData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [loginError, setLoginError] = useState(null);

  useEffect(() => {
    if (!user) {
      setInitialData({});
      return;
    }

    let mounted = true;
    setIsLoading(true);
    getBranding()
      .then((data) => {
        if (mounted) {
          setInitialData(data || {});
          setLoadError(null);
        }
      })
      .catch((err) => {
        if (mounted) {
          setLoadError(err?.message || 'Failed to load branding');
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [user]);

  if (!user) {
    return (
      <>
        <Header />
        <div className={styles.card}>
          <h2 className={styles.title}>Admin Login</h2>
          {loginError ? (
            <p role="alert" className={styles.errorText}>
              {loginError}
            </p>
          ) : null}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setLoginError(null);
              login().catch((err) => {
                setLoginError(err?.message || 'Failed to login');
              });
            }}
            className={styles.loginForm}
          >
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              required
            />
            <button type="submit" className={styles.loginBtn}>
              Login
            </button>
          </form>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className={pageStyles.wrapper}>
        <div className={pageStyles.heroShell}>
          <div className={pageStyles.heroContent}>
            <span className={pageStyles.microTitle}>Admin · Branding</span>
            <h1 className={pageStyles.heroTitle}>Customize the Taça da Pinga visuals</h1>
            <p className={pageStyles.subtitle}>
              Update the logos that appear on the live app. Uploads are compressed and validated
              locally.
            </p>
          </div>
          <div className={pageStyles.heroActions}>
            <button
              type="button"
              className={pageStyles.backButton}
              onClick={() => navigate('/admin')}
            >
              ← Voltar ao painel
            </button>
            <button onClick={logout} className={pageStyles.logoutButton}>
              Logout
            </button>
          </div>
        </div>

        {loadError ? (
          <p role="alert" className={pageStyles.errorBanner}>
            {loadError}
          </p>
        ) : null}

        <section className={pageStyles.formSection}>
          <BrandingForm
            initialBranding={initialData}
            isLoading={isLoading}
            onSave={async (payload) => {
              await updateBranding(payload);
              const refreshed = await getBranding();
              setInitialData(refreshed || {});
            }}
          />
        </section>
      </main>
    </>
  );
}

export { BrandingForm };
