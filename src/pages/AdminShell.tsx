import { Fragment, useEffect, useId, useMemo, useState, type ReactNode } from 'react';
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

  const activeNavDescription = useMemo(() => {
    const activeItem = navItems.find((item) => item.id === activeNav);
    return activeItem?.description;
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

  const renderMobileTabs = () => (
    <div className={styles.mobileTabRail}>
      <div className={styles.mobileTabs} role="tablist" aria-label="Secções do painel">
        {navItems.map((item) => {
          const isActive = item.id === activeNav;
          const className = isActive
            ? `${styles.mobileTab} ${styles.mobileTabActive}`
            : styles.mobileTab;

          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-label={item.label}
              aria-selected={isActive}
              onClick={() => handleSelectNav(item.id)}
              className={className}
            >
              {item.mobileLabel ?? item.label}
            </button>
          );
        })}
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setSidebarOpen(true)}
        aria-expanded={isSidebarOpen}
        aria-controls={mobilePanelId}
        aria-haspopup="dialog"
        className={styles.mobileMoreButton}
      >
        Mais
      </Button>
    </div>
  );

  return (
    <>
      <Page tone="frost" width="page" padding="md" className={styles.page}>
        <Section padding="none" className={styles.heroSection}>
          <Card variant="highlight" padding="lg" className={styles.heroCard}>
            <Stack gap="md">
              <Stack gap="sm" className={styles.heroHeading}>
                <Text as="span" variant="eyebrow" className={styles.eyebrow}>
                  Painel
                </Text>
                <Stack gap="sm">
                  <Stack direction="row" align="center" justify="between" gap="md" wrap>
                    <Stack gap="sm" className={styles.titleGroup}>
                      <Text as="h1" variant="hero" className={styles.title}>
                        {title}
                      </Text>
                      <Text as="p" variant="subtitle" className={styles.subtitle}>
                        Operação do torneio.
                      </Text>
                    </Stack>
                    <Stack direction="row" gap="xs" className={styles.heroActionsDesktop}>
                      <Button variant="secondary" size="sm" onClick={onNavigateBranding}>
                        Branding
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleLogout}>
                        Terminar sessão
                      </Button>
                    </Stack>
                  </Stack>
                </Stack>
              </Stack>
            </Stack>
          </Card>
        </Section>

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
                </Stack>
              </Card>
            </div>
            <div className={styles.main}>
              {renderMobileTabs()}
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
          onClick={() => setSidebarOpen(false)}
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
                  onClick={() => setSidebarOpen(false)}
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
