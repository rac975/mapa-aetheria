import styles from './Card.module.css';

/**
 * Componente Card estilo JRPG (Fabula Ultima / Blade UI) com cantos ornamentados.
 * @param {Object} props
 * @param {'default' | 'interactive' | 'ether' | 'crise'} [props.variant='default']
 * @param {boolean} [props.ornamented=true]
 * @param {React.ReactNode} props.children
 * @param {string} [props.className='']
 */
export default function Card({
  children,
  variant = 'default',
  ornamented = true,
  className = '',
  ...rest
}) {
  const cardClasses = [
    styles.card,
    styles[variant] || styles.default,
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cardClasses} {...rest}>
      {ornamented && (
        <>
          <span className={`${styles.ornamentCorner} ${styles.topLeft}`} aria-hidden="true" />
          <span className={`${styles.ornamentCorner} ${styles.topRight}`} aria-hidden="true" />
          <span className={`${styles.ornamentCorner} ${styles.bottomLeft}`} aria-hidden="true" />
          <span className={`${styles.ornamentCorner} ${styles.bottomRight}`} aria-hidden="true" />
        </>
      )}
      {children}
    </div>
  );
}
