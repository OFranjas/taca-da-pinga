import { useEffect, useMemo, useState, type FocusEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button, Grid, Stack, Text } from '../ui';
import { mergeClasses } from '../ui/components/utils';
import { getBranding, type BrandingData } from '../services/branding.service';
import defaultLogo from '../assets/logo.png';
import defaultIcon from '../logo.svg';
import styles from './Header.module.css';

const NAV_ITEMS = [
  { label: 'Leaderboard', to: '/leaderboard' },
  { label: 'Admin', to: '/admin' },
] as const;

type BrandingState = {
  mainLogo: string | null;
  icon: string | null;
};

const resolveBrandingState = (data: BrandingData | null | undefined): BrandingState => ({
  mainLogo: data?.mainLogoDataUrl ?? null,
  icon: data?.iconDataUrl ?? null,
});

const isFocusVisible = (element: HTMLElement) =>
  typeof element.matches === 'function' && element.matches(':focus-visible');

const handleFocusVisible = (event: FocusEvent<HTMLElement>) => {
  if (isFocusVisible(event.currentTarget)) {
    event.currentTarget.setAttribute('data-focus-visible', 'true');
  }
};

const handleBlur = (event: FocusEvent<HTMLElement>) => {
  event.currentTarget.removeAttribute('data-focus-visible');
};

export function Header() {
  const location = useLocation();
  const [branding, setBranding] = useState<BrandingState>({ mainLogo: null, icon: null });

  useEffect(() => {
    let mounted = true;
    void getBranding()
      .then((data) => {
        if (!mounted) {
          return;
        }
        setBranding(resolveBrandingState(data));
      })
      .catch(() => {
        if (!mounted) {
          return;
        }
        setBranding({ mainLogo: null, icon: null });
      });

    return () => {
      mounted = false;
    };
  }, []);

  const { mainLogoSrc, iconSrc, logoVariant, iconVariant } = useMemo(() => {
    const mainLogoSrc = branding.mainLogo ?? defaultLogo;
    const iconSrc = branding.icon ?? branding.mainLogo ?? defaultIcon;

    return {
      mainLogoSrc,
      iconSrc,
      logoVariant: branding.mainLogo ? 'remote' : 'fallback',
      iconVariant: branding.icon ? 'remote' : branding.mainLogo ? 'derived' : 'fallback',
    } as const;
  }, [branding]);

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <header className={styles.root} data-testid="app-header">
      <div className={styles.inner}>
        <Link to="/" className={styles.brandLink} aria-label="Ir para a página inicial">
          <span className={styles.brandVisual} data-logo-variant={logoVariant}>
            <img
              src={mainLogoSrc}
              alt="Logo Taça da Pinga"
              className={styles.brandImage}
              data-logo-variant={logoVariant}
            />
            <span className={styles.brandGlyph} data-logo-variant={iconVariant}>
              <img src={iconSrc} alt="Taça da Pinga icon" />
            </span>
          </span>
          <Stack direction="column" gap="sm" className={styles.brandCopy}>
            <Text as="span" variant="label" tone="secondary" className={styles.brandEyebrow}>
              Taça da
            </Text>
            <Text as="span" variant="heading" weight="bold" className={styles.brandTitle}>
              Pinga
            </Text>
          </Stack>
        </Link>

        <nav aria-label="Main" className={styles.nav} data-testid="header-nav-grid">
          <Grid
            className={styles.navGrid}
            columns={{ base: 2, md: 3, tv: 4 }}
            gap="sm"
            align="center"
          >
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.to);
              return (
                <Button
                  key={item.to}
                  as={Link}
                  to={item.to}
                  variant={active ? 'primary' : 'ghost'}
                  size="sm"
                  className={mergeClasses(
                    styles.navButton,
                    active ? styles.navButtonActive : undefined
                  )}
                  aria-current={active ? 'page' : undefined}
                  data-active={active ? 'true' : 'false'}
                  onFocus={handleFocusVisible}
                  onBlur={handleBlur}
                >
                  {item.label}
                </Button>
              );
            })}
          </Grid>
        </nav>
      </div>
    </header>
  );
}

export default Header;
