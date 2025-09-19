import { forwardRef, type HTMLAttributes } from 'react';
import styles from './Card.module.css';

type CardVariant = 'default' | 'muted' | 'glass' | 'accent';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';
type CardRadius = 'md' | 'lg' | 'xl';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  radius?: CardRadius;
}

const variantClassName: Record<CardVariant, string> = {
  default: styles.variantDefault,
  muted: styles.variantMuted,
  glass: styles.variantGlass,
  accent: styles.variantAccent,
};

const paddingClassName: Record<CardPadding, string> = {
  none: styles.paddingNone,
  sm: styles.paddingSm,
  md: styles.paddingMd,
  lg: styles.paddingLg,
};

const radiusClassName: Record<CardRadius, string> = {
  md: styles.radiusMd,
  lg: styles.radiusLg,
  xl: styles.radiusXl,
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', padding = 'md', radius = 'lg', ...props }, ref) => {
    const classes = [
      styles.card,
      variantClassName[variant],
      paddingClassName[padding],
      radiusClassName[radius],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return <div ref={ref} className={classes} {...props} />;
  }
);

Card.displayName = 'Card';
