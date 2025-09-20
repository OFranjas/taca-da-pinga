import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import BrandingForm from '../components/BrandingForm';
import { AdminLoginCard } from '../components/AdminLoginCard';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { getBranding, updateBranding, type BrandingData } from '../services/branding.service';
import { Button, Card, Grid, Page, Section, Stack, Text } from '../ui';
import styles from './Branding.module.css';

type UpdateBrandingPayload = Parameters<typeof updateBranding>[0];

export default function Branding() {
  const navigate = useNavigate();
  const { user, email, setEmail, password, setPassword, isCheckingAuth, login, logout } =
    useAdminAuth();
  const [initialData, setInitialData] = useState<BrandingData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (!user) {
      setInitialData({});
      return;
    }

    let mounted = true;
    setIsLoading(true);

    getBranding()
      .then((data) => {
        if (mounted) {
          setInitialData(data ?? {});
          setLoadError(null);
        }
      })
      .catch((error: unknown) => {
        if (mounted) {
          const message = error instanceof Error ? error.message : 'Failed to load branding';
          setLoadError(message);
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [user]);

  const handleLoginSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setLoginError(null);
      setIsLoggingIn(true);
      try {
        await login();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to login';
        setLoginError(message);
      } finally {
        setIsLoggingIn(false);
      }
    },
    [login]
  );

  const handleSave = async (payload: UpdateBrandingPayload) => {
    await updateBranding(payload);
    const refreshed = await getBranding();
    setInitialData(refreshed ?? {});
  };

  if (isCheckingAuth) {
    return (
      <>
        <Header />
        <Page
          tone="default"
          width="content"
          padding="none"
          fullHeight={false}
          innerClassName={styles.pageContentCentered}
        >
          <Section padding="none">
            <Card variant="muted" padding="lg">
              <Stack align="center" justify="center">
                <Text as="p" variant="label" tone="secondary" align="center">
                  Verificando sessão...
                </Text>
              </Stack>
            </Card>
          </Section>
        </Page>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header />
        <Page
          tone="default"
          width="content"
          padding="none"
          fullHeight={false}
          innerClassName={styles.pageContentCentered}
        >
          <Section padding="none" align="center">
            <AdminLoginCard
              email={email}
              password={password}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onSubmit={handleLoginSubmit}
              error={loginError}
              isSubmitting={isLoggingIn}
            />
          </Section>
        </Page>
      </>
    );
  }

  return (
    <>
      <Header />
      <Page width="page" innerClassName={styles.pageContent}>
        <Section padding="none">
          <Card variant="highlight" padding="xl">
            <Grid columns={{ base: 1, lg: 2 }} gap="lg" className={styles.heroGrid} align="start">
              <Stack gap="sm">
                <Text as="span" variant="eyebrow">
                  Admin · Branding
                </Text>
                <Text as="h1" variant="hero">
                  Customize the Taça da Pinga visuals
                </Text>
                <Text as="p" variant="subtitle">
                  Update the logos that appear on the live app. Uploads are compressed and validated
                  locally.
                </Text>
              </Stack>
              <Stack
                className={styles.heroActions}
                direction="column"
                gap="sm"
                wrap
                switchDirectionAt="md"
                switchTo="row"
              >
                <Button type="button" variant="secondary" onClick={() => navigate('/admin')}>
                  ← Voltar ao painel
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => {
                    void logout();
                  }}
                >
                  Logout
                </Button>
              </Stack>
            </Grid>
          </Card>
        </Section>

        {loadError ? (
          <Section padding="none">
            <Card variant="muted" padding="md" className={styles.errorCard}>
              <Text role="alert" className={styles.errorText}>
                {loadError}
              </Text>
            </Card>
          </Section>
        ) : null}

        <Section padding="none">
          <Card variant="muted" padding="lg" className={styles.formCard}>
            <BrandingForm initialBranding={initialData} isLoading={isLoading} onSave={handleSave} />
          </Card>
        </Section>
      </Page>
    </>
  );
}

export { BrandingForm };
