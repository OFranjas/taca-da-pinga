import { Fragment, useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import { Button, Card, Grid, Page, Section, Stack, Text } from '../ui';
import styles from './AdminShell.module.css';

export type AdminShellNavItem<TNav extends string = string> = {
  id: TNav;
  label: string;
  description?: string;
};

export type AdminShellBreadcrumb = {
  label: string;
  href?: string;
};

type AdminShellProps<TNav extends string = string> = {
  title: string;
  navItems: AdminShellNavItem<TNav>[];
  activeNav: TNav;
  onSelectNav: (id: TNav) => void;
  onNavigateBranding: () => void;
  onLogout: () => void;
  breadcrumbs?: AdminShellBreadcrumb[];
  children: ReactNode;
};

export function AdminShell<TNav extends string = string>({
  title,
  navItems,
  activeNav,
  onSelectNav,
  onNavigateBranding,
  onLogout,
  breadcrumbs,
  children,
}: AdminShellProps<TNav>) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const mobileNavId = useId();
  const desktopNavId = `${mobileNavId}-desktop`;
  const mobilePanelId = `${mobileNavId}-panel`;
  const mobileTitleId = `${mobileNavId}-title`;

  useEffect(() => {
    if (!isSidebarOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen]);

  const activeNavLabel = useMemo(() => {
    const activeItem = navItems.find((item) => item.id === activeNav);
    return activeItem?.label ?? '';
  }, [activeNav, navItems]);

  const handleSelectNav = (id: TNav) => {
    onSelectNav(id);
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    setSidebarOpen(false);
    onLogout();
  };

  const renderNavItems = (onSelect: (id: TNav) => void) => (
    <ul className={styles.navList}>
      {navItems.map((item) => {
        const isActive = item.id === activeNav;
        const className = isActive
          ? `${styles.navButton} ${styles.navButtonActive}`
          : styles.navButton;
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              className={className}
              aria-current={isActive ? 'page' : undefined}
            >
              <span>{item.label}</span>
              {item.description ? (
                <Text as="span" variant="label" tone="muted">
                  {item.description}
                </Text>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      <Page tone="default" padding="none" width="fluid">
        <Section className={styles.section} padding="lg">
          <Grid columns={{ base: 1, lg: 12 }} gap="lg" className={styles.layout} align="start">
            <div className={styles.sidebarDesktop}>
              <Card variant="muted" padding="md" className={styles.sidebarCard} fullHeight>
                <Stack gap="md">
                  <Text as="p" variant="label" tone="secondary" className={styles.sidebarTitle}>
                    Navegação
                  </Text>
                  <nav aria-label="Secções do painel" id={desktopNavId}>
                    {renderNavItems(handleSelectNav)}
                  </nav>
                </Stack>
              </Card>
            </div>
            <div className={styles.main}>
              <Card variant="muted" padding="md" gap="md">
                <Stack gap="sm">
                  <Stack
                    gap="sm"
                    direction="column"
                    justify="between"
                    switchDirectionAt="md"
                    switchTo="row"
                    align="stretch"
                  >
                    <Stack direction="row" align="center" gap="sm">
                      <button
                        type="button"
                        className={styles.mobileToggle}
                        onClick={() => setSidebarOpen(true)}
                        aria-expanded={isSidebarOpen}
                        aria-controls={mobilePanelId}
                        aria-haspopup="dialog"
                      >
                        Menu
                      </button>
                      <Text as="h1" variant="heading" className={styles.topbarHeading}>
                        {title}
                      </Text>
                    </Stack>
                    <div className={styles.actions}>
                      <Button variant="secondary" size="sm" onClick={onNavigateBranding}>
                        Branding
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleLogout}>
                        Terminar sessão
                      </Button>
                    </div>
                  </Stack>
                  {activeNavLabel ? (
                    <Text as="p" variant="label" tone="muted">
                      Secção atual: {activeNavLabel}
                    </Text>
                  ) : null}
                  {breadcrumbs && breadcrumbs.length > 0 ? (
                    <nav aria-label="Breadcrumbs" className={styles.breadcrumbs}>
                      {breadcrumbs.map((crumb, index) => (
                        <Fragment key={`${crumb.label}-${index}`}>
                          {crumb.href ? (
                            <a href={crumb.href} className={styles.breadcrumbLink}>
                              {crumb.label}
                            </a>
                          ) : (
                            <span>{crumb.label}</span>
                          )}
                          {index < breadcrumbs.length - 1 ? (
                            <span className={styles.breadcrumbSeparator}>/</span>
                          ) : null}
                        </Fragment>
                      ))}
                    </nav>
                  ) : null}
                </Stack>
              </Card>
              <Card variant="elevated" padding="lg" className={styles.contentCard} fullHeight>
                {children}
              </Card>
            </div>
          </Grid>
        </Section>
      </Page>
      {isSidebarOpen ? (
        <div
          className={styles.mobileBackdrop}
          role="dialog"
          aria-modal="true"
          aria-labelledby={mobileTitleId}
          onClick={() => setSidebarOpen(false)}
        >
          <div className={styles.mobileSidebar} onClick={(event) => event.stopPropagation()}>
            <Card variant="muted" padding="md" className={styles.mobileSidebarCard}>
              <div className={styles.mobileSidebarHeader}>
                <Text as="p" variant="subtitle" id={mobileTitleId}>
                  Navegação
                </Text>
                <button
                  type="button"
                  className={styles.mobileClose}
                  onClick={() => setSidebarOpen(false)}
                >
                  Fechar
                </button>
              </div>
              <nav aria-label="Secções do painel" id={mobilePanelId}>
                {renderNavItems(handleSelectNav)}
              </nav>
              <div className={styles.actions}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSidebarOpen(false);
                    onNavigateBranding();
                  }}
                >
                  Branding
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  Terminar sessão
                </Button>
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </>
  );
}
