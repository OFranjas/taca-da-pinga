import { Fragment, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { Button, Card, Grid, Page, Section, Stack, Text } from '../ui';
import styles from './AdminShell.module.css';

export type AdminShellNavItem<TNav extends string = string> = {
  id: TNav;
  label: string;
  mobileLabel?: string;
  description?: string;
};

export type AdminShellBreadcrumb = {
  label: string;
  href?: string;
};

type AdminShellProps<TNav extends string = string> = {
  navItems: AdminShellNavItem<TNav>[];
  activeNav: TNav;
  onSelectNav: (id: TNav) => void;
  onNavigateBranding: () => void;
  onLogout: () => void;
  breadcrumbs?: AdminShellBreadcrumb[];
  children: ReactNode;
};

export function AdminShell<TNav extends string = string>({
  navItems,
  activeNav,
  onSelectNav,
  onNavigateBranding,
  onLogout,
  breadcrumbs,
  children,
}: AdminShellProps<TNav>) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const mobileDialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const mobileNavId = useId();
  const desktopNavId = `${mobileNavId}-desktop`;
  const mobilePanelId = `${mobileNavId}-panel`;
  const mobileTitleId = `${mobileNavId}-title`;

  useEffect(() => {
    if (!isSidebarOpen) {
      previouslyFocusedElementRef.current?.focus();
      previouslyFocusedElementRef.current = null;
      return;
    }

    const focusableSelector =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const getFocusableElements = () =>
      Array.from(mobileDialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);

    const focusableElements = getFocusableElements();
    focusableElements[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const currentFocusableElements = getFocusableElements();
      const firstElement = currentFocusableElements[0];
      const lastElement = currentFocusableElements.at(-1);
      if (!firstElement || !lastElement) {
        event.preventDefault();
        return;
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen]);

  const openMobileMenu = () => {
    previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;
    setSidebarOpen(true);
  };

  const closeMobileMenu = () => setSidebarOpen(false);

  const activeNavLabel = useMemo(() => {
    const activeItem = navItems.find((item) => item.id === activeNav);
    return activeItem?.label ?? '';
  }, [activeNav, navItems]);

  const activeNavDescription = useMemo(() => {
    const activeItem = navItems.find((item) => item.id === activeNav);
    return activeItem?.description;
  }, [activeNav, navItems]);

  const handleSelectNav = (id: TNav) => {
    onSelectNav(id);
    closeMobileMenu();
  };

  const handleLogout = () => {
    closeMobileMenu();
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
              <span className={styles.navDot} aria-hidden />
              <div className={styles.navCopy}>
                <Text as="span" variant="label" className={styles.navLabel}>
                  {item.label}
                </Text>
                {item.description ? (
                  <Text as="span" variant="label" tone="muted" className={styles.navDescription}>
                    {item.description}
                  </Text>
                ) : null}
              </div>
              {isActive ? <span className={styles.navGlow} aria-hidden /> : null}
            </button>
          </li>
        );
      })}
    </ul>
  );

  const renderMobileMenuBar = () => (
    <div className={styles.mobileTabRail}>
      <Button
        variant="secondary"
        size="sm"
        onClick={openMobileMenu}
        aria-expanded={isSidebarOpen}
        aria-controls={mobilePanelId}
        aria-haspopup="dialog"
        className={styles.mobileMoreButton}
      >
        Menu
      </Button>
      <Text as="span" variant="label" className={styles.mobileActiveLabel}>
        {activeNavLabel || 'Painel Admin'}
      </Text>
    </div>
  );

  return (
    <>
      <Page tone="frost" width="page" padding="md" className={styles.page}>
        <Section padding="none" className={styles.shellSection}>
          <Grid columns={{ base: 1, lg: 12 }} gap="lg" className={styles.layout} align="start">
            <div className={styles.sidebarDesktop}>
              <Card variant="muted" padding="lg" className={styles.sidebarCard} fullHeight>
                <Stack gap="md">
                  <div className={styles.sidebarHeader}>
                    <Text as="p" variant="label" tone="secondary" className={styles.sidebarTitle}>
                      Secções
                    </Text>
                  </div>
                  <nav aria-label="Secções do painel" id={desktopNavId}>
                    {renderNavItems(handleSelectNav)}
                  </nav>
                  <div className={styles.sidebarFooter}>
                    <Button
                      as="a"
                      href="/display"
                      target="_blank"
                      rel="noreferrer"
                      variant="secondary"
                      size="sm"
                      fullWidth
                    >
                      Abrir modo TV
                    </Button>
                    <Button variant="secondary" size="sm" onClick={onNavigateBranding}>
                      Branding
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleLogout}>
                      Terminar sessão
                    </Button>
                  </div>
                </Stack>
              </Card>
            </div>
            <div className={styles.main}>
              {renderMobileMenuBar()}
              <Card variant="elevated" padding="xl" className={styles.contentCard} fullHeight>
                <Stack gap="md" className={styles.contentHeader}>
                  <Stack gap="sm">
                    <Text as="h2" variant="heading" className={styles.sectionHeading}>
                      {activeNavLabel || 'Painel Admin'}
                    </Text>
                    {activeNavDescription ? (
                      <Text as="p" variant="subtitle" className={styles.sectionSubtitle}>
                        {activeNavDescription}
                      </Text>
                    ) : null}
                  </Stack>
                  {breadcrumbs && breadcrumbs.length > 0 ? (
                    <nav aria-label="Breadcrumbs" className={styles.breadcrumbsInline}>
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
                <div className={styles.content}>{children}</div>
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
          ref={mobileDialogRef}
          onClick={closeMobileMenu}
        >
          <div className={styles.mobileSidebar} onClick={(event) => event.stopPropagation()}>
            <Card variant="muted" padding="lg" className={styles.mobileSidebarCard}>
              <div className={styles.mobileSidebarHeader}>
                <div>
                  <Text
                    as="p"
                    variant="heading"
                    className={styles.mobileEyebrow}
                    id={mobileTitleId}
                  >
                    Painel Admin
                  </Text>
                </div>
                <button
                  type="button"
                  className={styles.mobileClose}
                  onClick={closeMobileMenu}
                  aria-label="Fechar menu"
                >
                  ×
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
                    closeMobileMenu();
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
