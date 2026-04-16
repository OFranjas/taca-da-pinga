import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { Button as ShadcnButton } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

const variantMap: Record<ButtonVariant, ComponentPropsWithoutRef<typeof ShadcnButton>['variant']> =
  {
    primary: 'default',
    secondary: 'secondary',
    ghost: 'outline',
    danger: 'destructive',
  };

const sizeMap: Record<ButtonSize, ComponentPropsWithoutRef<typeof ShadcnButton>['size']> = {
  sm: 'sm',
  md: 'default',
  lg: 'lg',
};

const sizeClassMap: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 text-sm',
  md: 'min-h-11 px-5 text-base',
  lg: 'min-h-13 px-6 text-lg',
};

const variantClassMap: Record<ButtonVariant, string> = {
  primary:
    '!border-transparent !bg-[var(--ui-color-accent)] !text-[var(--ui-color-text-inverted)] hover:!bg-[var(--ui-color-accent-strong)]',
  secondary:
    '!border-[rgba(34,197,94,0.4)] !bg-[var(--ui-color-accent-soft)] !text-[var(--ui-color-accent)] hover:!bg-[rgba(34,197,94,0.2)]',
  ghost:
    '!border-[rgba(148,163,184,0.2)] !bg-transparent !text-[var(--ui-color-text-secondary)] hover:!bg-[rgba(148,163,184,0.12)] hover:!text-[var(--ui-color-text-secondary)]',
  danger:
    '!border-[rgba(239,68,68,0.55)] !bg-[var(--ui-color-danger-soft)] !text-[var(--ui-color-danger)] hover:!bg-[var(--ui-color-danger)] hover:!text-[var(--ui-color-text-inverted)]',
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
  const classNames = cn(
    'rounded-full font-semibold transition-transform active:translate-y-px',
    variantClassMap[variant],
    sizeClassMap[size],
    fullWidth ? 'w-full' : undefined,
    className
  );

  if (!as || Component === 'button') {
    const { type, ...buttonProps } = componentProps as ComponentPropsWithoutRef<'button'>;
    return (
      <ShadcnButton
        type={type ?? 'button'}
        variant={variantMap[variant]}
        size={sizeMap[size]}
        {...buttonProps}
        className={classNames}
      >
        {children}
      </ShadcnButton>
    );
  }

  return (
    <ShadcnButton asChild variant={variantMap[variant]} size={sizeMap[size]} className={classNames}>
      <Component {...componentProps}>{children}</Component>
    </ShadcnButton>
  );
}
