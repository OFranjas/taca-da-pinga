import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import styles from './Page.module.css';
import { mergeClasses } from './utils';

type PagePadding = 'none' | 'sm' | 'md' | 'lg';
type PageTone = 'default' | 'frost';
type PageWidth = 'fluid' | 'page' | 'content';

export type PageProps = Omit<ComponentPropsWithoutRef<'main'>, 'children'> & {
  children: ReactNode;
  tone?: PageTone;
  padding?: PagePadding;
  width?: PageWidth;
  innerClassName?: string;
  fullHeight?: boolean;
};

const toneClassMap: Record<PageTone, string> = {
  default: styles.toneDefault,
  frost: styles.toneFrost,
};

const paddingClassMap: Record<PagePadding, string> = {
  none: styles.paddingNone,
  sm: styles.paddingSm,
  md: styles.paddingMd,
  lg: styles.paddingLg,
};

const widthClassMap: Record<PageWidth, string> = {
  fluid: styles.widthFluid,
  page: styles.widthPage,
  content: styles.widthContent,
};

export function Page({
  children,
  tone = 'frost',
  padding = 'lg',
  width = 'page',
  className,
  innerClassName,
  fullHeight = true,
  ...rest
}: PageProps) {
  const rootClassName = mergeClasses(
    styles.root,
    fullHeight ? styles.fullHeight : undefined,
    toneClassMap[tone],
    paddingClassMap[padding],
    className
  );
  const innerClass = mergeClasses(styles.inner, widthClassMap[width], innerClassName);

  return (
    <main className={rootClassName} {...rest}>
      <div className={innerClass}>{children}</div>
    </main>
  );
}
