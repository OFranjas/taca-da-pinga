import type { ReactNode } from 'react';
import { Page, Section, Grid, Stack, Text } from '../ui';
import Header from './Header';
import styles from './AppShell.module.css';

type AppShellAction = {
  label: string;
  element: ReactNode;
};

type AppShellProps = {
  title?: string;
  subtitle?: string;
  actions?: AppShellAction[];
  children: ReactNode;
};

export function AppShell({ title, subtitle, actions, children }: AppShellProps) {
  const hasHero = Boolean(title || subtitle || (actions && actions.length > 0));

  return (
    <div className={styles.root} data-app-shell>
      <Header />
      <Page
        className={styles.page}
        innerClassName={styles.pageInner}
        padding="lg"
        tone="frost"
        width="page"
      >
        <Stack gap="xl" className={styles.pageStack}>
          {hasHero ? (
            <Section padding="lg" tone="muted" className={styles.heroSection}>
              <Stack
                direction="row"
                align="center"
                justify="between"
                switchDirectionAt="md"
                switchTo="column"
                gap="md"
                className={styles.heroStack}
              >
                <Stack gap="sm" className={styles.heroCopy}>
                  {title ? (
                    <Text as="h1" variant="heading" weight="bold" className={styles.heroTitle}>
                      {title}
                    </Text>
                  ) : null}
                  {subtitle ? (
                    <Text
                      as="p"
                      variant="subtitle"
                      tone="secondary"
                      className={styles.heroSubtitle}
                    >
                      {subtitle}
                    </Text>
                  ) : null}
                </Stack>
                {actions && actions.length > 0 ? (
                  <Stack direction="row" gap="sm" justify="end" wrap className={styles.heroActions}>
                    {actions.map((action) => (
                      <span key={action.label} className={styles.heroActionItem}>
                        {action.element}
                      </span>
                    ))}
                  </Stack>
                ) : null}
              </Stack>
            </Section>
          ) : null}

          <Section padding="none" className={styles.contentSection}>
            <Grid
              className={styles.contentGrid}
              data-testid="app-shell-grid"
              columns={{ base: 1, md: 12, tv: 16 }}
              gap="lg"
            >
              {children}
            </Grid>
          </Section>
        </Stack>
      </Page>
    </div>
  );
}

export default AppShell;
