import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import styles from './Card.module.css';
import { mergeClasses } from './utils';

type CardVariant = 'elevated' | 'muted' | 'highlight';
type CardPadding = 'sm' | 'md' | 'lg' | 'xl';
type CardGap = 'sm' | 'md' | 'lg';

export type CardProps = Omit<ComponentPropsWithoutRef<'article'>, 'children'> & {
  children: ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  gap?: CardGap;
  fullHeight?: boolean;
};

const variantClassMap: Record<CardVariant, string> = {
  elevated: styles.variantElevated,
  muted: styles.variantMuted,
  highlight: styles.variantHighlight,
};

const paddingClassMap: Record<CardPadding, string> = {
  sm: styles.paddingSm,
  md: styles.paddingMd,
  lg: styles.paddingLg,
  xl: styles.paddingXl,
};

const gapClassMap: Record<CardGap, string> = {
  sm: styles.gapSm,
  md: styles.gapMd,
  lg: styles.gapLg,
};

export function Card({
  children,
  variant = 'elevated',
  padding = 'lg',
  gap = 'md',
  fullHeight = false,
  className,
  ...rest
}: CardProps) {
  const classNames = mergeClasses(
    styles.root,
    variantClassMap[variant],
    paddingClassMap[padding],
    gapClassMap[gap],
    fullHeight ? styles.fullHeight : undefined,
    className
  );

  return (
    <article className={classNames} {...rest}>
      {children}
    </article>
  );
}
