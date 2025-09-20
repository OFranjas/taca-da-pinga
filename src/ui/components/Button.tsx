import type { ComponentPropsWithoutRef } from 'react';
import styles from './Button.module.css';
import { mergeClasses } from './utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonBaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

type ButtonAsButton = ButtonBaseProps & {
  as?: 'button';
} & ComponentPropsWithoutRef<'button'>;

type ButtonAsAnchor = ButtonBaseProps & {
  as: 'a';
} & ComponentPropsWithoutRef<'a'>;

export type ButtonProps = ButtonAsButton | ButtonAsAnchor;

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

export function Button(props: ButtonProps) {
  if (props.as === 'a') {
    const {
      as: _as,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      className,
      ...anchorProps
    } = props;
    const classNames = mergeClasses(
      styles.root,
      variantClassMap[variant],
      sizeClassMap[size],
      fullWidth ? styles.fullWidth : undefined,
      className
    );
    return <a {...anchorProps} className={classNames} />;
  }

  const {
    as: _as = 'button',
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    className,
    type = 'button',
    ...buttonProps
  } = props;

  const classNames = mergeClasses(
    styles.root,
    variantClassMap[variant],
    sizeClassMap[size],
    fullWidth ? styles.fullWidth : undefined,
    className
  );

  return <button type={type} {...buttonProps} className={classNames} />;
}
