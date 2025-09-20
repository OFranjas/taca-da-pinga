import type { FormEvent } from 'react';
import { Button, Card, Stack, Text } from '../ui';
import styles from './AdminLoginCard.module.css';

type AdminLoginCardProps = {
  email: string;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  error?: string | null;
  isSubmitting?: boolean;
  title?: string;
  submitLabel?: string;
};

export function AdminLoginCard({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  error,
  isSubmitting = false,
  title = 'Admin Login',
  submitLabel = 'Login',
}: AdminLoginCardProps) {
  return (
    <div className={styles.root}>
      <Card variant="elevated" padding="lg" gap="md">
        <Stack gap="sm">
          <Text as="h2" variant="heading">
            {title}
          </Text>
          {error ? (
            <Text as="p" role="alert" tone="danger" className={styles.error}>
              {error}
            </Text>
          ) : null}
        </Stack>
        <form className={styles.form} onSubmit={onSubmit}>
          <label className={styles.field} htmlFor="admin-login-email">
            <span className={styles.label}>Email</span>
            <input
              id="admin-login-email"
              type="email"
              value={email}
              onChange={(event) => onEmailChange(event.currentTarget.value)}
              className={styles.input}
              autoComplete="email"
              required
              disabled={isSubmitting}
            />
          </label>
          <label className={styles.field} htmlFor="admin-login-password">
            <span className={styles.label}>Senha</span>
            <input
              id="admin-login-password"
              type="password"
              value={password}
              onChange={(event) => onPasswordChange(event.currentTarget.value)}
              className={styles.input}
              autoComplete="current-password"
              required
              disabled={isSubmitting}
            />
          </label>
          <div className={styles.actions}>
            <Button type="submit" fullWidth disabled={isSubmitting}>
              {submitLabel}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
