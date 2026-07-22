import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import type { TablerIcon } from '@tabler/icons-react';
import { Button } from './Button';
import styles from './AdminActionButton.module.css';
import { mergeClasses } from './utils';

type AdminActionTone = 'neutral' | 'danger';

export type AdminActionButtonProps = Omit<ComponentPropsWithoutRef<'button'>, 'children'> & {
  children: ReactNode;
  icon: TablerIcon;
  tone?: AdminActionTone;
};

/** A compact, labelled action for rows in admin lists. */
export function AdminActionButton({
  children,
  className,
  icon: Icon,
  tone = 'neutral',
  ...props
}: AdminActionButtonProps) {
  return (
    <Button
      {...props}
      variant={tone === 'danger' ? 'danger' : 'ghost'}
      size="md"
      className={mergeClasses(
        styles.root,
        tone === 'neutral' ? styles.neutral : undefined,
        className
      )}
    >
      <Icon className={styles.icon} aria-hidden="true" />
      {children}
    </Button>
  );
}
