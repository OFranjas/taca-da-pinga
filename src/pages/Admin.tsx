import { useCallback, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import AddPingasPanel from '../components/AddPingasPanel';
import ManageTeamsPanel from '../components/ManageTeamsPanel';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { AdminLoginCard } from '../components/AdminLoginCard';
import { Page, Section, Card, Stack, Text } from '../ui';
import styles from './Admin.module.css';
import { toast } from 'react-toastify';

const ADMIN_SECTIONS = {
  Add: 'add',
  Manage: 'manage',
} as const;

type AdminSection = (typeof ADMIN_SECTIONS)[keyof typeof ADMIN_SECTIONS];

export default function Admin() {
  const navigate = useNavigate();
  const { user, email, password, setEmail, setPassword, login, logout, isCheckingAuth } =
    useAdminAuth();
  const [activeSection, setActiveSection] = useState<AdminSection>(ADMIN_SECTIONS.Add);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLoginSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setLoginError(null);
      setIsLoggingIn(true);
      try {
        await login();
        toast.success('Logged in successfully');
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to login';
        setLoginError(message);
        toast.error(message);
      } finally {
        setIsLoggingIn(false);
      }
    },
    [login]
  );

  const handleLogout = useCallback(async () => {
    await logout();
    toast.info('Logged out');
  }, [logout]);

  if (isCheckingAuth) {
    return (
      <>
        <Header />
        <Page
          tone="default"
          width="content"
          padding="none"
          fullHeight={false}
          innerClassName={styles.pageContentCentered}
        >
          <Section padding="none">
            <Card variant="muted" padding="lg">
              <Stack align="center" justify="center">
                <Text as="p" variant="label" tone="secondary" align="center">
                  Verificando sessão...
                </Text>
              </Stack>
            </Card>
          </Section>
        </Page>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header />
        <Page
          tone="default"
          width="content"
          padding="none"
          fullHeight={false}
          innerClassName={styles.pageContentCentered}
        >
          <Section padding="none" align="center">
            <AdminLoginCard
              email={email}
              password={password}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onSubmit={handleLoginSubmit}
              error={loginError}
              isSubmitting={isLoggingIn}
            />
          </Section>
        </Page>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>Painel Admin</h2>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={() => navigate('/admin/branding')}
            >
              Branding
            </button>
            <button
              type="button"
              onClick={() => {
                void handleLogout();
              }}
              className={styles.logoutBtn}
            >
              Logout
            </button>
          </div>
        </div>
        <div className={styles.tabBar} role="tablist" aria-label="Admin sections">
          <button
            role="tab"
            aria-selected={activeSection === ADMIN_SECTIONS.Add}
            className={activeSection === ADMIN_SECTIONS.Add ? styles.activeTab : styles.tab}
            onClick={() => setActiveSection(ADMIN_SECTIONS.Add)}
          >
            Adicionar Pingas
          </button>
          <button
            role="tab"
            aria-selected={activeSection === ADMIN_SECTIONS.Manage}
            className={activeSection === ADMIN_SECTIONS.Manage ? styles.activeTab : styles.tab}
            onClick={() => setActiveSection(ADMIN_SECTIONS.Manage)}
          >
            Gerir Equipas
          </button>
        </div>

        {activeSection === ADMIN_SECTIONS.Add ? <AddPingasPanel /> : <ManageTeamsPanel />}
      </div>
    </>
  );
}
