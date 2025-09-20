import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import styles from './Stack.module.css';
import { mergeClasses } from './utils';

type StackDirection = 'row' | 'column';
type StackGap = 'sm' | 'md' | 'lg' | 'xl';
type StackJustify = 'start' | 'center' | 'between' | 'end';
type StackAlign = 'start' | 'center' | 'stretch';
type StackSwitchBreakpoint = 'sm' | 'md' | 'lg' | 'xl' | 'tv';

type StackPropsBase = {
  children: ReactNode;
  direction?: StackDirection;
  gap?: StackGap;
  justify?: StackJustify;
  align?: StackAlign;
  wrap?: boolean;
  switchDirectionAt?: StackSwitchBreakpoint;
  switchTo?: StackDirection;
};

export type StackProps = StackPropsBase &
  Omit<ComponentPropsWithoutRef<'div'>, keyof StackPropsBase | 'children'>;

const directionClassMap: Record<StackDirection, string> = {
  row: styles.directionRow,
  column: styles.directionColumn,
};

const gapClassMap: Record<StackGap, string> = {
  sm: styles.gapSm,
  md: styles.gapMd,
  lg: styles.gapLg,
  xl: styles.gapXl,
};

const justifyClassMap: Record<StackJustify, string> = {
  start: styles.justifyStart,
  center: styles.justifyCenter,
  between: styles.justifyBetween,
  end: styles.justifyEnd,
};

const alignClassMap: Record<StackAlign, string> = {
  start: styles.alignStart,
  center: styles.alignCenter,
  stretch: styles.alignStretch,
};

const switchClassMap: Record<StackDirection, Record<StackSwitchBreakpoint, string>> = {
  row: {
    sm: styles.switchRowSm,
    md: styles.switchRowMd,
    lg: styles.switchRowLg,
    xl: styles.switchRowXl,
    tv: styles.switchRowTv,
  },
  column: {
    sm: styles.switchColumnSm,
    md: styles.switchColumnMd,
    lg: styles.switchColumnLg,
    xl: styles.switchColumnXl,
    tv: styles.switchColumnTv,
  },
};

export function Stack({
  children,
  direction = 'column',
  gap = 'md',
  justify = 'start',
  align = 'stretch',
  wrap = false,
  switchDirectionAt,
  switchTo,
  className,
  ...rest
}: StackProps) {
  const switchClass =
    switchDirectionAt && switchTo ? switchClassMap[switchTo][switchDirectionAt] : undefined;

  const classNames = mergeClasses(
    styles.root,
    directionClassMap[direction],
    gapClassMap[gap],
    justifyClassMap[justify],
    alignClassMap[align],
    wrap ? styles.wrap : undefined,
    switchClass,
    className
  );

  return (
    <div className={classNames} {...rest}>
      {children}
    </div>
  );
}
