import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import styles from './Section.module.css';
import { mergeClasses } from './utils';

type SectionGap = 'sm' | 'md' | 'lg';
type SectionPadding = 'none' | 'sm' | 'md' | 'lg';
type SectionTone = 'transparent' | 'muted';
type SectionAlign = 'start' | 'center' | 'stretch';

export type SectionProps = Omit<ComponentPropsWithoutRef<'section'>, 'children'> & {
  children: ReactNode;
  gap?: SectionGap;
  padding?: SectionPadding;
  tone?: SectionTone;
  align?: SectionAlign;
};

const gapClassMap: Record<SectionGap, string> = {
  sm: styles.gapSm,
  md: styles.gapMd,
  lg: styles.gapLg,
};

const paddingClassMap: Record<SectionPadding, string> = {
  none: styles.paddingNone,
  sm: styles.paddingSm,
  md: styles.paddingMd,
  lg: styles.paddingLg,
};

const toneClassMap: Record<SectionTone, string> = {
  transparent: styles.toneTransparent,
  muted: styles.toneMuted,
};

const alignClassMap: Record<SectionAlign, string> = {
  start: styles.alignStart,
  center: styles.alignCenter,
  stretch: styles.alignStretch,
};

export function Section({
  children,
  gap = 'md',
  padding = 'md',
  tone = 'transparent',
  align = 'stretch',
  className,
  ...rest
}: SectionProps) {
  const classNames = mergeClasses(
    styles.root,
    toneClassMap[tone],
    gapClassMap[gap],
    paddingClassMap[padding],
    alignClassMap[align],
    className
  );

  return (
    <section className={classNames} {...rest}>
      {children}
    </section>
  );
}
