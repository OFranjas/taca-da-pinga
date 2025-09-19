import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import Header from '../components/Header';
import { auth } from '../firebase';
import BrandingForm from '../components/BrandingForm';
import { getBranding, updateBranding } from '../services/branding.service';
import pageStyles from './Branding.module.css';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Section } from '../components/ui/Section';

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
        <main className={pageStyles.page}>
          <Card className={pageStyles.loginCard} padding="lg" radius="lg">
            <h2 className={pageStyles.loginHeader}>Admin Login</h2>
            {loginError ? (
              <p role="alert" className={pageStyles.alert}>
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
              className={pageStyles.loginForm}
            >
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={pageStyles.loginInput}
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={pageStyles.loginInput}
              />
              <Button type="submit" className={pageStyles.loginButton}>
                Login
              </Button>
            </form>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className={pageStyles.page}>
        <Section
          as="div"
          variant="accent"
          padding="lg"
          radius="xl"
          shadow="elevated"
          className={pageStyles.heroShell}
        >
          <div className={pageStyles.heroContent}>
            <span className={pageStyles.microTitle}>Admin · Branding</span>
            <h1 className={pageStyles.heroTitle}>Customize the Taça da Pinga visuals</h1>
            <p className={pageStyles.subtitle}>
              Update the logos that appear on the live app. Uploads are compressed and validated
              locally.
            </p>
          </div>
          <div className={pageStyles.heroActions}>
            <Button type="button" variant="accentSubtle" onClick={() => navigate('/admin')}>
              ← Voltar ao painel
            </Button>
            <Button type="button" variant="danger" onClick={logout}>
              Logout
            </Button>
          </div>
        </Section>

        {loadError ? (
          <p role="alert" className={pageStyles.errorBanner}>
            {loadError}
          </p>
        ) : null}

        <Section
          as="section"
          variant="muted"
          padding="lg"
          radius="xl"
          shadow="card"
          className={pageStyles.formSection}
        >
          <BrandingForm
            initialBranding={initialData}
            isLoading={isLoading}
            onSave={async (payload) => {
              await updateBranding(payload);
              const refreshed = await getBranding();
              setInitialData(refreshed || {});
            }}
          />
        </Section>
      </main>
    </>
  );
}

export { BrandingForm };
