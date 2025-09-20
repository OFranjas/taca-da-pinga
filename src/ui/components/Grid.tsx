import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from 'react';
import styles from './Grid.module.css';
import { mergeClasses } from './utils';

type ResponsiveKey = 'base' | 'sm' | 'md' | 'lg' | 'xl' | 'tv';

const responsiveSuffixMap: Record<ResponsiveKey, string> = {
  base: '',
  sm: '-sm',
  md: '-md',
  lg: '-lg',
  xl: '-xl',
  tv: '-tv',
};

type ResponsiveNumber = number | Partial<Record<ResponsiveKey, number>>;
type ResponsiveSize = string | Partial<Record<ResponsiveKey, string>>;

type GridGap = 'sm' | 'md' | 'lg';
type GridAlign = 'start' | 'center' | 'stretch';

type GridPropsBase = {
  children: ReactNode;
  columns?: ResponsiveNumber;
  minColumnWidth?: ResponsiveSize;
  autoFit?: boolean;
  gap?: GridGap;
  align?: GridAlign;
  justify?: GridAlign;
};

export type GridProps = GridPropsBase &
  Omit<ComponentPropsWithoutRef<'div'>, keyof GridPropsBase | 'children'>;

const gapClassMap: Record<GridGap, string> = {
  sm: styles.gapSm,
  md: styles.gapMd,
  lg: styles.gapLg,
};

const alignClassMap: Record<GridAlign, string> = {
  start: styles.alignStart,
  center: styles.alignCenter,
  stretch: styles.alignStretch,
};

const justifyClassMap: Record<GridAlign, string> = {
  start: styles.justifyStart,
  center: styles.justifyCenter,
  stretch: styles.justifyStretch,
};

const toCssVariables = (
  value: ResponsiveNumber | ResponsiveSize | undefined,
  prefix: string
): CSSProperties => {
  if (value === undefined) {
    return {};
  }

  if (typeof value === 'number' || typeof value === 'string') {
    return { [prefix]: String(value) } as CSSProperties;
  }

  return Object.entries(value).reduce<CSSProperties>((acc, [key, val]) => {
    if (val === undefined) {
      return acc;
    }
    const suffix = responsiveSuffixMap[key as ResponsiveKey];
    acc[`${prefix}${suffix}` as keyof CSSProperties] = String(val) as never;
    return acc;
  }, {});
};

export function Grid({
  children,
  columns,
  minColumnWidth,
  autoFit = false,
  gap = 'md',
  align = 'stretch',
  justify = 'stretch',
  className,
  style,
  ...rest
}: GridProps) {
  const modeClass = autoFit ? styles.modeAutoFit : styles.modeFixed;
  const cssVariables: CSSProperties = {
    ...toCssVariables(columns, '--grid-columns'),
  };

  if (minColumnWidth) {
    Object.assign(cssVariables, toCssVariables(minColumnWidth, '--grid-min-column'));
  }

  const mergedStyle = { ...cssVariables, ...style };
  const classNames = mergeClasses(
    styles.root,
    modeClass,
    gapClassMap[gap],
    alignClassMap[align],
    justifyClassMap[justify],
    className
  );

  return (
    <div className={classNames} style={mergedStyle} {...rest}>
      {children}
    </div>
  );
}
