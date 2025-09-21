import { useEffect, useMemo, useState, type FocusEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button, Grid, Text } from '../ui';
import { mergeClasses } from '../ui/components/utils';
import { observeBranding, type BrandingData } from '../services/branding.service';
import defaultIcon from '../assets/beer.svg';
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
    const unsubscribe = observeBranding(
      (data) => {
        setBranding(resolveBrandingState(data));
      },
      () => {
        setBranding({ mainLogo: null, icon: null });
      }
    );

    return unsubscribe;
  }, []);

  const { brandImageSrc, brandVariant } = useMemo(() => {
    const brandImageSrc = branding.icon ?? branding.mainLogo ?? defaultIcon;
    return {
      brandImageSrc,
      brandVariant: branding.icon ? 'icon' : branding.mainLogo ? 'logo' : 'fallback',
    } as const;
  }, [branding]);

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <header className={styles.root} data-testid="app-header">
      <div className={styles.inner}>
        <Link to="/" className={styles.brandLink} aria-label="Ir para a página inicial">
          <span className={styles.brandAvatar} data-logo-variant={brandVariant}>
            <img src={brandImageSrc} alt="Taça da Pinga" className={styles.brandImage} />
          </span>
          <Text as="span" variant="heading" weight="bold" className={styles.brandTitle}>
            Taça da Pinga
          </Text>
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
