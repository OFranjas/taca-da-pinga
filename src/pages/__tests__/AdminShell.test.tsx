import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { UseAdminAuthResult } from '../../hooks/useAdminAuth';
import { AdminGuard } from '../AdminGuard';
import { AdminShell, type AdminShellNavItem } from '../AdminShell';

type PartialAuth = Partial<UseAdminAuthResult>;

const createAuth = (overrides: PartialAuth = {}): UseAdminAuthResult => ({
  user: null,
  email: '',
  password: '',
  isCheckingAuth: false,
  setEmail: vi.fn(),
  setPassword: vi.fn(),
  login: vi.fn(async () => {}),
  logout: vi.fn(async () => {}),
  ...overrides,
});

const navItems: AdminShellNavItem[] = [
  { id: 'add', label: 'Adicionar Pingas' },
  { id: 'manage', label: 'Gerir Equipas' },
];

describe('AdminGuard', () => {
  it('renders loading feedback while checking auth', () => {
    const auth = createAuth({ isCheckingAuth: true });

    render(
      <AdminGuard auth={auth} onSubmit={vi.fn()}>
        <div>Should not render</div>
      </AdminGuard>
    );

    expect(screen.getByText(/Verificando sessão/i)).toBeInTheDocument();
    expect(screen.queryByText(/Should not render/i)).not.toBeInTheDocument();
  });

  it('renders login card when user is missing', () => {
    const auth = createAuth();

    render(
      <AdminGuard auth={auth} onSubmit={vi.fn()}>
        <div>content</div>
      </AdminGuard>
    );

    expect(screen.getByRole('heading', { name: /Painel Admin/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Entrar/i })).toBeInTheDocument();
  });

  it('allows children to render once authenticated', () => {
    const auth = createAuth({ user: { uid: 'admin' } as UseAdminAuthResult['user'] });

    render(
      <AdminGuard auth={auth} onSubmit={vi.fn()}>
        <div>Protected content</div>
      </AdminGuard>
    );

    expect(screen.getByText(/Protected content/i)).toBeInTheDocument();
  });
});

describe('AdminShell', () => {
  const createUser = () => {
    const maybeSetup = (userEvent as unknown as { setup?: () => typeof userEvent }).setup;
    return typeof maybeSetup === 'function' ? maybeSetup() : userEvent;
  };

  it('highlights the active navigation item and calls onSelectNav', async () => {
    const user = createUser();
    const onSelectNav = vi.fn();

    render(
      <AdminShell
        navItems={navItems}
        activeNav="add"
        onSelectNav={onSelectNav}
        onNavigateBranding={vi.fn()}
        onLogout={vi.fn()}
      >
        <div>Admin content</div>
      </AdminShell>
    );

    await user.click(screen.getByRole('button', { name: /Menu/i }));

    const addNav = screen.getByRole('button', { name: /Adicionar Pingas/i });
    const manageNav = screen.getByRole('button', { name: /Gerir Equipas/i });

    expect(addNav).toHaveAttribute('aria-current', 'page');
    expect(manageNav).not.toHaveAttribute('aria-current');

    await user.click(manageNav);
    expect(onSelectNav).toHaveBeenCalledWith('manage');
  });

  it('uses the active section as the only admin context label', () => {
    render(
      <AdminShell
        navItems={navItems}
        activeNav="add"
        onSelectNav={vi.fn()}
        onNavigateBranding={vi.fn()}
        onLogout={vi.fn()}
      >
        <div>Admin content</div>
      </AdminShell>
    );

    expect(screen.getByRole('heading', { name: 'Adicionar Pingas' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Painel Admin' })).not.toBeInTheDocument();
    expect(screen.queryByText('Operação do torneio.')).not.toBeInTheDocument();
  });

  it('traps focus in the mobile menu and restores it after closing', async () => {
    const user = createUser();

    render(
      <AdminShell
        navItems={navItems}
        activeNav="add"
        onSelectNav={vi.fn()}
        onNavigateBranding={vi.fn()}
        onLogout={vi.fn()}
      >
        <button type="button">Outside control</button>
      </AdminShell>
    );

    const menuButton = screen.getByRole('button', { name: 'Menu' });
    await user.click(menuButton);

    const closeButton = screen.getByRole('button', { name: 'Fechar menu' });
    expect(closeButton).toHaveFocus();

    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(screen.getByRole('button', { name: 'Terminar sessão' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(menuButton).toHaveFocus();
  });

  it('renders menu actions and breadcrumbs', async () => {
    const user = createUser();
    const onNavigateBranding = vi.fn();
    const onLogout = vi.fn();

    render(
      <AdminShell
        navItems={navItems}
        activeNav="manage"
        onSelectNav={vi.fn()}
        onNavigateBranding={onNavigateBranding}
        onLogout={onLogout}
        breadcrumbs={[{ label: 'Início', href: '/' }, { label: 'Admin' }]}
      >
        <div>Admin content</div>
      </AdminShell>
    );

    expect(screen.getByRole('navigation', { name: /Breadcrumbs/i })).toHaveTextContent('Início');
    expect(screen.getByText('Admin')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Menu/i }));

    await user.click(screen.getByRole('button', { name: /Branding/i }));
    expect(onNavigateBranding).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /Menu/i }));
    await user.click(screen.getByRole('button', { name: /Terminar sessão/i }));
    expect(onLogout).toHaveBeenCalled();
  });
});
