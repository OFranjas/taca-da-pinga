import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import styles from './FileInput.module.css';

export interface FileInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'> {
  label: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
  buttonLabel?: ReactNode;
  fileName?: string | null;
  fullWidth?: boolean;
  className?: string;
  inputClassName?: string;
}

export const FileInput = forwardRef<HTMLInputElement, FileInputProps>(
  (
    {
      id,
      label,
      hint,
      action,
      buttonLabel = 'Choose file',
      fileName,
      className = '',
      inputClassName = '',
      fullWidth = true,
      'aria-describedby': describedBy,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id ?? `${generatedId}-file`;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const describedByValue = [describedBy, hintId].filter(Boolean).join(' ') || undefined;

    const wrapperClasses = [styles.wrapper, fullWidth ? styles.fullWidth : '', className]
      .filter(Boolean)
      .join(' ');

    const inputClasses = [styles.hiddenInput, inputClassName].filter(Boolean).join(' ');

    return (
      <div className={wrapperClasses}>
        <div className={styles.header}>
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
          {action ? <div className={styles.headerAction}>{action}</div> : null}
        </div>
        {hint ? (
          <div id={hintId} className={styles.hint}>
            {hint}
          </div>
        ) : null}
        <div className={styles.controls}>
          <input
            id={inputId}
            ref={ref}
            type="file"
            className={inputClasses}
            aria-describedby={describedByValue}
            {...props}
          />
          <label htmlFor={inputId} className={styles.triggerButton}>
            {buttonLabel}
          </label>
          {fileName ? (
            <span className={styles.fileName} title={fileName}>
              {fileName}
            </span>
          ) : null}
        </div>
      </div>
    );
  }
);

FileInput.displayName = 'FileInput';
