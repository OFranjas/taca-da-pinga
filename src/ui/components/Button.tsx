import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import styles from './Button.module.css';
import { mergeClasses } from './utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonOwnProps<TElement extends ElementType> = {
  as?: TElement;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
  children?: ReactNode;
};

export type ButtonProps<TElement extends ElementType = 'button'> = ButtonOwnProps<TElement> &
  Omit<ComponentPropsWithoutRef<TElement>, keyof ButtonOwnProps<TElement>>;

const variantClassMap: Record<ButtonVariant, string> = {
  primary: styles.variantPrimary,
  secondary: styles.variantSecondary,
  ghost: styles.variantGhost,
  danger: styles.variantDanger,
};

const sizeClassMap: Record<ButtonSize, string> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
};

export function Button<TElement extends ElementType = 'button'>(props: ButtonProps<TElement>) {
  const {
    as,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    className,
    children,
    ...rest
  } = props;

  const Component = (as ?? 'button') as ElementType;
  const componentProps = rest as ComponentPropsWithoutRef<TElement>;

  const classNames = mergeClasses(
    styles.root,
    variantClassMap[variant],
    sizeClassMap[size],
    fullWidth ? styles.fullWidth : undefined,
    className
  );

  if (!as || Component === 'button') {
    const { type, ...buttonProps } = componentProps as ComponentPropsWithoutRef<'button'>;
    return (
      <button type={type ?? 'button'} {...buttonProps} className={classNames}>
        {children}
      </button>
    );
  }

  return (
    <Component {...componentProps} className={classNames}>
      {children}
    </Component>
  );
}
