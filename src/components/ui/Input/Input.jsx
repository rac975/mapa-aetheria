import styles from './Input.module.css';

/**
 * Componente Input com temática Blade UI / Fabula Ultima.
 * @param {Object} props
 * @param {string} [props.label]
 * @param {string} [props.error]
 * @param {string} [props.helperText]
 * @param {string} [props.className='']
 */
export default function Input({
  label,
  error,
  helperText,
  id,
  className = '',
  disabled,
  ...rest
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const inputClasses = [
    styles.input,
    error ? styles.inputError : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <div className={styles.inputContainer}>
        <input
          id={inputId}
          disabled={disabled}
          className={inputClasses}
          {...rest}
        />
      </div>
      {error && <span className={styles.errorMessage}>{error}</span>}
      {!error && helperText && <span className={styles.helperText}>{helperText}</span>}
    </div>
  );
}
