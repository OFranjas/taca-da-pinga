import {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import defaultBrandImage from '../assets/beer.svg';
import { listSponsors, type Sponsor } from '../services/sponsors.service';
import { observeBranding } from '../services/branding.service';
import { Button, Card, Page, Section, Stack, Text } from '../ui';
import styles from './Home.module.css';

const DEFAULT_ERROR_MESSAGE = 'Não foi possível carregar os patrocinadores.';

type SponsorsStatus = 'loading' | 'success' | 'error';

type BrandingState = {
  mainLogo: string | null;
  icon: string | null;
};

interface SponsorsErrorBoundaryProps {
  children: ReactNode;
}

interface SponsorsErrorBoundaryState {
  hasError: boolean;
}

class SponsorsErrorBoundary extends Component<
  SponsorsErrorBoundaryProps,
  SponsorsErrorBoundaryState
> {
  state: SponsorsErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): SponsorsErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    console.error('Sponsors section failed to render', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card variant="muted" padding="lg" className={styles.feedbackCard} role="alert">
          <Stack align="center" gap="sm">
            <Text as="p" tone="danger" align="center">
              Ocorreu um erro inesperado ao exibir os patrocinadores.
            </Text>
            <Text as="p" variant="subtitle" tone="secondary" align="center">
              Recarregue a página e tente novamente.
            </Text>
          </Stack>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default function Home() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<SponsorsStatus>('loading');
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [branding, setBranding] = useState<BrandingState | null>(null);
  const isMountedRef = useRef(false);

  const fetchSponsors = useCallback(async () => {
    if (!isMountedRef.current) {
      return;
    }

    setStatus('loading');
    setErrorMessage(null);

    try {
      const data = await listSponsors({ activeOnly: true });
      if (!isMountedRef.current) {
        return;
      }
      setSponsors(data);
      setStatus('success');
    } catch (error: unknown) {
      if (!isMountedRef.current) {
        return;
      }
      const message =
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : DEFAULT_ERROR_MESSAGE;
      setErrorMessage(message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    void fetchSponsors();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchSponsors]);

  useEffect(() => {
    const toNullableDataUrl = (value?: string) =>
      typeof value === 'string' && value.trim().length > 0 ? value : null;

    const unsubscribe = observeBranding(
      (data) => {
        setBranding({
          mainLogo: toNullableDataUrl(data?.mainLogoDataUrl),
          icon: toNullableDataUrl(data?.iconDataUrl),
        });
      },
      () => {
        setBranding({ mainLogo: null, icon: null });
      }
    );

    return unsubscribe;
  }, []);

  const heroLogoSrc = useMemo(() => {
    if (!branding) {
      return null;
    }
    return branding.mainLogo ?? branding.icon ?? defaultBrandImage;
  }, [branding]);

  const renderSponsorsGrid = (items: Sponsor[]) => {
    const shouldLoop = items.length > 1;
    const renderedItems = shouldLoop ? [...items, ...items] : items;
    const trackClassName = shouldLoop
      ? `${styles.sponsorTrack} ${styles.sponsorTrackAnimated}`
      : styles.sponsorTrack;

    return (
      <div className={styles.sponsorCarousel} role="list" aria-label="Patrocinadores">
        <div className={trackClassName}>
          {renderedItems.map((sponsor, index) => {
            const hasLink = Boolean(sponsor.link && sponsor.link.trim().length > 0);
            const isDuplicate = shouldLoop && index >= items.length;
            return (
              <Card
                key={`${isDuplicate ? 'duplicate' : 'sponsor'}-${sponsor.id}-${index}`}
                variant="muted"
                padding="lg"
                className={`${styles.sponsorCard} ${isDuplicate ? styles.duplicateSponsorCard : ''}`}
                fullHeight
                role={isDuplicate ? undefined : 'listitem'}
                aria-hidden={isDuplicate ? 'true' : undefined}
              >
                <Stack align="center" gap="md" className={styles.sponsorCardContent}>
                  <div className={styles.sponsorImageFrame}>
                    <img
                      src={sponsor.imageDataUrl}
                      alt={isDuplicate ? '' : sponsor.name}
                      loading="lazy"
                      className={styles.sponsorImage}
                    />
                  </div>
                  <Text as="strong" variant="label" className={styles.sponsorName}>
                    {sponsor.name}
                  </Text>
                  {hasLink ? (
                    <Button
                      as="a"
                      href={sponsor.link ?? '#'}
                      target="_blank"
                      rel="noreferrer"
                      variant="secondary"
                      size="sm"
                      className={styles.sponsorLink}
                      aria-label={`Abrir o site de ${sponsor.name} em uma nova aba`}
                    >
                      Visitar site
                    </Button>
                  ) : null}
                </Stack>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSponsorsContent = () => {
    if (status === 'loading') {
      return (
        <div data-testid="home-sponsors-loading" className={styles.skeletonContainer}>
          <Text as="span" role="status" className={styles.visuallyHidden}>
            Carregando patrocinadores...
          </Text>
          <div className={styles.skeletonGrid}>
            {Array.from({ length: 3 }).map((_, index) => (
              <Card
                key={index}
                variant="muted"
                padding="lg"
                className={styles.skeletonCard}
                aria-hidden="true"
              >
                <div className={styles.skeletonBlock} />
                <div className={styles.skeletonLine} />
              </Card>
            ))}
          </div>
        </div>
      );
    }

    if (status === 'error' && sponsors.length === 0) {
      return (
        <Card variant="muted" padding="lg" className={styles.feedbackCard}>
          <Stack align="center" gap="sm">
            <Text as="p" role="alert" tone="danger" align="center">
              {errorMessage ?? DEFAULT_ERROR_MESSAGE}
            </Text>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                void fetchSponsors();
              }}
            >
              Tentar novamente
            </Button>
          </Stack>
        </Card>
      );
    }

    if (status === 'error' && sponsors.length > 0) {
      return (
        <Stack gap="md">
          <Card variant="muted" padding="md" className={styles.feedbackCard}>
            <Stack align="center" gap="sm">
              <Text as="p" role="alert" tone="danger" align="center">
                {errorMessage ?? DEFAULT_ERROR_MESSAGE}
              </Text>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  void fetchSponsors();
                }}
              >
                Atualizar lista
              </Button>
            </Stack>
          </Card>
          {renderSponsorsGrid(sponsors)}
        </Stack>
      );
    }

    if (sponsors.length === 0) {
      return (
        <Card variant="muted" padding="lg" className={styles.feedbackCard}>
          <Stack align="center" gap="sm">
            <Text as="p" align="center">
              Nenhum patrocinador ainda.
            </Text>
            <Text as="p" variant="label" tone="secondary" align="center">
              Assim que novas marcas entrarem na Taça da Pinga, elas aparecem aqui automaticamente.
            </Text>
          </Stack>
        </Card>
      );
    }

    return renderSponsorsGrid(sponsors);
  };

  return (
    <>
      <Header />
      <Page width="page" tone="frost">
        <Section padding="none">
          <Card variant="highlight" padding="xl" className={styles.heroCard}>
            <Stack gap="xl" align="center" className={styles.heroContent}>
              <Stack align="center" gap="sm" className={styles.heroHeading}>
                <div className={styles.heroLogoWrapper}>
                  {heroLogoSrc ? (
                    <img src={heroLogoSrc} alt="Logo Taça da Pinga" className={styles.heroLogo} />
                  ) : (
                    <span className={styles.heroLogoSkeleton} aria-hidden="true" />
                  )}
                </div>
                <Text as="span" variant="eyebrow" tone="secondary" align="center">
                  Futebol + comunidade
                </Text>
                <Text as="h1" variant="hero" align="center">
                  Taça da Pinga
                </Text>
                <Text as="p" variant="subtitle" tone="secondary" align="center">
                  A classificação oficial do torneio, sempre pronta para jogadores, bancada e ecrã.
                </Text>
              </Stack>
              <Stack
                direction="column"
                gap="sm"
                justify="center"
                align="stretch"
                wrap
                switchDirectionAt="md"
                switchTo="row"
                className={styles.ctaGroup}
              >
                <Button
                  size="lg"
                  fullWidth
                  className={styles.ctaButton}
                  onClick={() => {
                    navigate('/leaderboard');
                  }}
                >
                  Ver leaderboard
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  fullWidth
                  className={styles.ctaButton}
                  onClick={() => {
                    navigate('/admin');
                  }}
                >
                  Painel admin
                </Button>
              </Stack>
            </Stack>
          </Card>
        </Section>

        <SponsorsErrorBoundary>
          <Section
            tone="transparent"
            className={styles.sponsorsSection}
            aria-live="polite"
            aria-busy={status === 'loading'}
          >
            <Stack gap="sm" className={styles.sponsorsHeading}>
              <Text as="span" variant="eyebrow" tone="secondary">
                Patrocínio oficial
              </Text>
              <Text as="h2" variant="heading">
                Quem torna a Taça da Pinga possível
              </Text>
            </Stack>
            {renderSponsorsContent()}
          </Section>
        </SponsorsErrorBoundary>
      </Page>
    </>
  );
}
