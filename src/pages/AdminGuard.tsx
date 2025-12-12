import type { FormEvent, ReactNode } from 'react';
import { AdminLoginCard } from '../components/AdminLoginCard';
import type { UseAdminAuthResult } from '../hooks/useAdminAuth';
import { Card, Page, Section, Stack, Text } from '../ui';
import styles from './AdminGuard.module.css';

export type AdminGuardProps = {
  auth: UseAdminAuthResult;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSubmitting?: boolean;
  error?: string | null;
  children: ReactNode;
};

export function AdminGuard({
  auth,
  onSubmit,
  isSubmitting = false,
  error = null,
  children,
}: AdminGuardProps) {
  const { isCheckingAuth, user, email, password, setEmail, setPassword } = auth;

  if (isCheckingAuth) {
    return (
      <Page tone="frost" width="page" padding="md" innerClassName={styles.centered}>
        <Section padding="none" className={styles.guardShell}>
          <Card variant="muted" padding="lg" className={styles.loadingCard}>
            <Stack align="center" gap="md">
              <Text as="span" variant="eyebrow">
                Painel Admin
              </Text>
              <Text as="p" variant="label" tone="secondary" align="center">
                Verificando sessão...
              </Text>
            </Stack>
          </Card>
        </Section>
      </Page>
    );
  }

  if (!user) {
    return (
      <Page tone="frost" width="page" padding="md" innerClassName={styles.centered}>
        <Section padding="none" className={styles.guardGrid} gap="lg">
          <Card variant="highlight" padding="md" className={styles.helperCard}>
            <Stack gap="md">
              <div className={styles.helperHeading}>
                <Text as="span" variant="eyebrow">
                  Acesso seguro
                </Text>
                <Text as="h2" variant="heading">
                  Painel Admin
                </Text>
              </div>
              <Text as="p" variant="subtitle" className={styles.helperCopy}>
                Área reservada à organização. Autentica-te com as credenciais da equipa para gerir o
                evento.
              </Text>
            </Stack>
          </Card>
          <div className={styles.formColumn}>
            <AdminLoginCard
              email={email}
              password={password}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onSubmit={onSubmit}
              error={error}
              isSubmitting={isSubmitting}
              title="Entrar no Painel"
              submitLabel="Entrar"
            />
          </div>
        </Section>
      </Page>
    );
  }

  return <>{children}</>;
}
