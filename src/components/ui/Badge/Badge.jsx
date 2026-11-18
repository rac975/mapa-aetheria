import styles from './Badge.module.css';

/**
 * Componente Badge estilizado para tags, status e afinidades de Fabula Ultima.
 * @param {Object} props
 * @param {'default' | 'gold' | 'ether' | 'core' | 'pv' | 'pm' | 'pi' | 'crise' | 'villain'} [props.variant='default']
 * @param {'sm' | 'md' | 'lg'} [props.size='md']
 * @param {React.ReactNode} props.children
 * @param {string} [props.className='']
 */
export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...rest
}) {
  const classNames = [
    styles.badge,
    styles[variant] || styles.default,
    styles[size] || styles.md,
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classNames} {...rest}>
      {children}
    </span>
  );
}
