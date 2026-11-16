import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';

/**
 * Componente Modal estilo JRPG / Fabula Ultima.
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {string} [props.title]
 * @param {'sm' | 'md' | 'lg' | 'xl'} [props.size='md']
 * @param {React.ReactNode} props.children
 * @param {React.ReactNode} [props.footer]
 * @param {string} [props.className='']
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
  footer,
  className = '',
  ...rest
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={`${styles.modalWindow} ${styles[size] || styles.md} ${className}`}
        onClick={(e) => e.stopPropagation()}
        {...rest}
      >
        <span className={`${styles.ornamentCorner} ${styles.topLeft}`} aria-hidden="true" />
        <span className={`${styles.ornamentCorner} ${styles.topRight}`} aria-hidden="true" />
        <span className={`${styles.ornamentCorner} ${styles.bottomLeft}`} aria-hidden="true" />
        <span className={`${styles.ornamentCorner} ${styles.bottomRight}`} aria-hidden="true" />

        {title && (
          <header className={styles.header}>
            <h3 className={styles.title}>{title}</h3>
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Fechar modal"
            >
              ✕
            </button>
          </header>
        )}

        <div className={styles.body}>{children}</div>

        {footer && <footer className={styles.footer}>{footer}</footer>}
      </div>
    </div>,
    document.body
  );
}
