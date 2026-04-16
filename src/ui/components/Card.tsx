import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { Card as ShadcnCard } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
  elevated:
    'border !border-[rgba(148,163,184,0.28)] !bg-[var(--ui-color-surface)] shadow-[var(--ui-shadow-card)]',
  muted:
    'border !border-[var(--ui-color-border-subtle)] !bg-[var(--ui-color-surface-muted)] shadow-[var(--ui-shadow-soft)]',
  highlight:
    'border !border-[rgba(45,212,191,0.28)] !bg-[linear-gradient(140deg,rgba(15,118,110,0.08),rgba(34,197,94,0.15))] shadow-[var(--ui-shadow-card)]',
};

const paddingClassMap: Record<CardPadding, string> = {
  sm: 'p-[var(--ui-space-md)]',
  md: 'p-[var(--ui-space-lg)]',
  lg: 'p-[var(--ui-space-xl)]',
  xl: 'p-[calc(var(--ui-space-xl)+var(--ui-space-sm))]',
};

const gapClassMap: Record<CardGap, string> = {
  sm: 'gap-[var(--ui-space-md)]',
  md: 'gap-[var(--ui-space-lg)]',
  lg: 'gap-[var(--ui-space-xl)]',
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
  const classNames = cn(
    'flex flex-col overflow-hidden rounded-[var(--ui-radius-xl)] ring-0',
    variantClassMap[variant],
    paddingClassMap[padding],
    gapClassMap[gap],
    fullHeight ? 'h-full' : undefined,
    className
  );

  return (
    <ShadcnCard asChild className={classNames}>
      <article {...rest}>{children}</article>
    </ShadcnCard>
  );
}
