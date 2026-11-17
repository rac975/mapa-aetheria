import { createPortal } from 'react-dom';
import { FaUndo } from 'react-icons/fa';
import styles from './UndoToast.module.css';

export default function UndoToast({
  mostrar,
  mensagem,
  progressoKey,
  duracaoMs = 5000,
  onUndo
}) {
  if (!mostrar || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={styles.undoPortalContainer}
      role="status"
      aria-live="polite"
      style={{ '--toast-duration': `${duracaoMs}ms` }}
    >
      <div className={styles.undoCard}>
        <div className={styles.undoContent}>
          <div className={styles.undoMessage}>
            {typeof mensagem === 'string' ? <span>{mensagem}</span> : mensagem}
          </div>
          <button
            type="button"
            className={styles.btnUndo}
            onClick={onUndo}
            aria-label="Desfazer exclusão"
          >
            <FaUndo /> Desfazer
          </button>
        </div>
        <div key={progressoKey} className={styles.undoProgressBar} />
      </div>
    </div>,
    document.body
  );
}
