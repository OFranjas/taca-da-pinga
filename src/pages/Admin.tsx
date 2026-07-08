import { useCallback, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AddPingasPanel from '../components/AddPingasPanel';
import Header from '../components/Header';
import ManageTeamsPanel from '../components/ManageTeamsPanel';
import SponsorsAdminPanel from '../components/SponsorsAdminPanel';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { AdminGuard } from './AdminGuard';
import { AdminShell, type AdminShellNavItem } from './AdminShell';

const ADMIN_SECTIONS = {
  Add: 'add',
  Manage: 'manage',
  Sponsors: 'sponsors',
} as const;

type AdminSection = (typeof ADMIN_SECTIONS)[keyof typeof ADMIN_SECTIONS];

const NAV_ITEMS: AdminShellNavItem<AdminSection>[] = [
  {
    id: ADMIN_SECTIONS.Add,
    label: 'Registar pingas',
    mobileLabel: 'Pingas',
  },
  {
    id: ADMIN_SECTIONS.Manage,
    label: 'Gerir Equipas',
    mobileLabel: 'Equipas',
  },
  {
    id: ADMIN_SECTIONS.Sponsors,
    label: 'Gerir Patrocinadores',
    mobileLabel: 'Patrocínios',
  },
];

export default function Admin() {
  const navigate = useNavigate();
  const auth = useAdminAuth();
  const [activeSection, setActiveSection] = useState<AdminSection>(ADMIN_SECTIONS.Add);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLoginSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setLoginError(null);
      setIsLoggingIn(true);
      try {
        await auth.login();
        toast.success('Sessão iniciada');
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Falha no login';
        setLoginError(message);
        toast.error(message);
      } finally {
        setIsLoggingIn(false);
      }
    },
    [auth]
  );

  const handleLogout = useCallback(async () => {
    await auth.logout();
    toast.info('Sessão terminada');
  }, [auth]);

  return (
    <>
      <Header />
      <AdminGuard
        auth={auth}
        onSubmit={handleLoginSubmit}
        isSubmitting={isLoggingIn}
        error={loginError}
      >
        <AdminShell
          title="Admin"
          navItems={NAV_ITEMS}
          activeNav={activeSection}
          onSelectNav={(section) => {
            setActiveSection(section);
          }}
          onNavigateBranding={() => navigate('/admin/branding')}
          onLogout={() => {
            void handleLogout();
          }}
        >
          {activeSection === ADMIN_SECTIONS.Add ? <AddPingasPanel /> : null}
          {activeSection === ADMIN_SECTIONS.Manage ? <ManageTeamsPanel /> : null}
          {activeSection === ADMIN_SECTIONS.Sponsors ? <SponsorsAdminPanel /> : null}
        </AdminShell>
      </AdminGuard>
    </>
  );
}
