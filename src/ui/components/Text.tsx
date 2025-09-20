import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import styles from './Text.module.css';
import { mergeClasses } from './utils';

type TextVariant = 'eyebrow' | 'hero' | 'heading' | 'subtitle' | 'body' | 'label';
type TextTone = 'default' | 'muted' | 'secondary' | 'danger';
type TextAlign = 'start' | 'center' | 'end';
type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';

type TextPropsBase<TElement extends ElementType> = {
  children: ReactNode;
  as?: TElement;
  variant?: TextVariant;
  tone?: TextTone;
  align?: TextAlign;
  weight?: TextWeight;
};

export type TextProps<TElement extends ElementType = 'p'> = TextPropsBase<TElement> &
  Omit<ComponentPropsWithoutRef<TElement>, keyof TextPropsBase<TElement> | 'children'>;

const variantClassMap: Record<TextVariant, string> = {
  eyebrow: styles.variantEyebrow,
  hero: styles.variantHero,
  heading: styles.variantHeading,
  subtitle: styles.variantSubtitle,
  body: styles.variantBody,
  label: styles.variantLabel,
};

const toneClassMap: Record<TextTone, string> = {
  default: styles.toneDefault,
  muted: styles.toneMuted,
  secondary: styles.toneSecondary,
  danger: styles.toneDanger,
};

const alignClassMap: Record<TextAlign, string> = {
  start: styles.alignStart,
  center: styles.alignCenter,
  end: styles.alignEnd,
};

const weightClassMap: Record<TextWeight, string> = {
  regular: styles.weightRegular,
  medium: styles.weightMedium,
  semibold: styles.weightSemibold,
  bold: styles.weightBold,
};

export function Text<TElement extends ElementType = 'p'>({
  as,
  children,
  variant = 'body',
  tone = 'default',
  align = 'start',
  weight,
  className,
  ...rest
}: TextProps<TElement>) {
  const Element = (as ?? 'p') as ElementType;
  const classNames = mergeClasses(
    styles.root,
    variantClassMap[variant],
    toneClassMap[tone],
    alignClassMap[align],
    weight ? weightClassMap[weight] : undefined,
    className
  );

  return (
    <Element className={classNames} {...(rest as ComponentPropsWithoutRef<TElement>)}>
      {children}
    </Element>
  );
}
