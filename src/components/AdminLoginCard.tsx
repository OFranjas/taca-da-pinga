import type { FormEvent } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
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
            <Alert variant="destructive" className={styles.error}>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </Stack>
        <form className={styles.form} onSubmit={onSubmit}>
          <FieldGroup className={styles.fieldGroup}>
            <Field className={styles.field}>
              <FieldLabel htmlFor="admin-login-email" className={styles.label}>
                Email
              </FieldLabel>
              <Input
                id="admin-login-email"
                type="email"
                value={email}
                onChange={(event) => onEmailChange(event.currentTarget.value)}
                className={styles.input}
                autoComplete="email"
                required
                disabled={isSubmitting}
              />
            </Field>
            <Field className={styles.field}>
              <FieldLabel htmlFor="admin-login-password" className={styles.label}>
                Senha
              </FieldLabel>
              <Input
                id="admin-login-password"
                type="password"
                value={password}
                onChange={(event) => onPasswordChange(event.currentTarget.value)}
                className={styles.input}
                autoComplete="current-password"
                required
                disabled={isSubmitting}
              />
            </Field>
          </FieldGroup>
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
