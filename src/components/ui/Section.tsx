import { forwardRef, type HTMLAttributes } from 'react';
import styles from './Section.module.css';

type SectionVariant = 'plain' | 'surface' | 'muted' | 'accent';
type SectionPadding = 'sm' | 'md' | 'lg' | 'xl';
type SectionRadius = 'md' | 'lg' | 'xl';
type SectionShadow = 'none' | 'card' | 'elevated';

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section';
  variant?: SectionVariant;
  padding?: SectionPadding;
  radius?: SectionRadius;
  shadow?: SectionShadow;
}

const variantClassName: Record<SectionVariant, string> = {
  plain: styles.variantPlain,
  surface: styles.variantSurface,
  muted: styles.variantMuted,
  accent: styles.variantAccent,
};

const paddingClassName: Record<SectionPadding, string> = {
  sm: styles.paddingSm,
  md: styles.paddingMd,
  lg: styles.paddingLg,
  xl: styles.paddingXl,
};

const radiusClassName: Record<SectionRadius, string> = {
  md: styles.radiusMd,
  lg: styles.radiusLg,
  xl: styles.radiusXl,
};

const shadowClassName: Record<SectionShadow, string> = {
  none: styles.shadowNone,
  card: styles.shadowCard,
  elevated: styles.shadowElevated,
};

export const Section = forwardRef<HTMLElement, SectionProps>(
  (
    {
      as = 'section',
      className = '',
      variant = 'plain',
      padding = 'md',
      radius = 'lg',
      shadow = 'none',
      ...props
    },
    ref
  ) => {
    const Component = as;
    const classes = [
      styles.section,
      variantClassName[variant],
      paddingClassName[padding],
      radiusClassName[radius],
      shadowClassName[shadow],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return <Component ref={ref as never} className={classes} {...props} />;
  }
);

Section.displayName = 'Section';
