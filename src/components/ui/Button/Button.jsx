import styles from './Button.module.css';

/**
 * Componente Button reutilizável no estilo Fabula Ultima / Xenoblade 2.
 * @param {Object} props
 * @param {'primary' | 'secondary' | 'danger' | 'ghost' | 'core'} [props.variant='primary']
 * @param {'sm' | 'md' | 'lg'} [props.size='md']
 * @param {boolean} [props.fullWidth=false]
 * @param {React.ReactNode} props.children
 * @param {string} [props.className='']
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  type = 'button',
  ...rest
}) {
  const classNames = [
    styles.button,
    styles[variant] || styles.primary,
    styles[size] || styles.md,
    fullWidth ? styles.fullWidth : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classNames} {...rest}>
      {children}
    </button>
  );
}
