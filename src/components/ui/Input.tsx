import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import styles from './Input.module.css';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ id, label, hint, error, className = '', fullWidth = true, 'aria-describedby': describedBy, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    const describedByValue = [describedBy, hintId, errorId].filter(Boolean).join(' ') || undefined;

    const wrapperClasses = [styles.wrapper, fullWidth ? styles.fullWidth : '', className]
      .filter(Boolean)
      .join(' ');

    const inputClasses = [styles.input, error ? styles.inputError : ''].filter(Boolean).join(' ');

    return (
      <div className={wrapperClasses}>
        {label ? (
          <label className={styles.label} htmlFor={inputId}>
            {label}
          </label>
        ) : null}
        <input
          id={inputId}
          ref={ref}
          className={inputClasses}
          aria-invalid={Boolean(error)}
          aria-describedby={describedByValue}
          {...props}
        />
        {hint ? (
          <p id={hintId} className={styles.hint}>
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={errorId} className={styles.error}>
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
