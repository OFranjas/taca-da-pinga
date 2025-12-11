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
      <Page tone="default" width="content" padding="none" innerClassName={styles.centered}>
        <Section padding="none" align="center">
          <Card variant="muted" padding="lg">
            <Stack align="center">
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
      <Page tone="default" width="content" padding="none" innerClassName={styles.centered}>
        <Section padding="none" align="center" gap="lg">
          <Stack gap="sm" align="center" className={styles.helper}>
            <Text as="h2" variant="heading" align="center">
              Painel Admin
            </Text>
            <Text as="p" tone="secondary" align="center">
              Faz login com as credenciais da equipa organizadora. Precisas de acesso? Contacta-nos
              em <a href="mailto:orga@taca.pt">orga@taca.pt</a>.
            </Text>
          </Stack>
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
        </Section>
      </Page>
    );
  }

  return <>{children}</>;
}
