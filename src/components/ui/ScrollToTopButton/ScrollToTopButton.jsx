import { useState, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { FaArrowUp } from 'react-icons/fa';
import styles from './ScrollToTopButton.module.css';

function ScrollToTopButton({ threshold = 200 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const mainContent = document.querySelector('.main-content');
      const containerScroll = mainContent ? mainContent.scrollTop : 0;
      const windowScroll = window.scrollY || document.documentElement?.scrollTop || document.body?.scrollTop || 0;
      const currentScroll = Math.max(containerScroll, windowScroll);
      setVisible(currentScroll > threshold);
    };

    // Ouvinte em fase de captura para capturar eventos de rolagem de elementos sem bolha como .main-content
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    document.addEventListener('scroll', handleScroll, { passive: true, capture: true });

    // Checagem assíncrona inicial (caso a página já inicie rolada)
    const timer = setTimeout(handleScroll, 50);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll, { capture: true });
      document.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [threshold]);

  const scrollToTop = () => {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (document.documentElement) {
      document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <button
      type="button"
      className={`${styles.button} ${visible ? styles.visible : ''}`}
      onClick={scrollToTop}
      aria-label="Voltar ao topo"
      title="Voltar ao topo"
    >
      <FaArrowUp className={styles.icon} />
    </button>,
    document.body
  );
}

export default memo(ScrollToTopButton);
