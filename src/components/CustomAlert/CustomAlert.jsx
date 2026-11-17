import { createPortal } from 'react-dom';
import { 
  FaExclamationTriangle, 
  FaTimes, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaInfoCircle, 
  FaQuestionCircle 
} from 'react-icons/fa';
import styles from './CustomAlert.module.css';

export default function CustomAlert({ 
  isOpen, 
  title, 
  message, 
  onClose, 
  onConfirm, 
  type = 'alert',
  confirmText,
  cancelText
}) {
  if (!isOpen || typeof document === 'undefined') return null;

  const renderIcon = () => {
    switch (type) {
      case 'error':
        return <FaTimesCircle className={styles.iconError} />;
      case 'success':
        return <FaCheckCircle className={styles.iconSuccess} />;
      case 'info':
        return <FaInfoCircle className={styles.iconInfo} />;
      case 'confirm':
        return <FaQuestionCircle className={styles.iconWarning} />;
      case 'warning':
      case 'alert':
      default:
        return <FaExclamationTriangle className={styles.iconWarning} />;
    }
  };

  const getCardVariantClass = () => {
    switch (type) {
      case 'error':
        return styles.alertBoxError;
      case 'success':
        return styles.alertBoxSuccess;
      case 'info':
        return styles.alertBoxInfo;
      case 'warning':
      case 'confirm':
      case 'alert':
      default:
        return styles.alertBoxWarning;
    }
  };

  const defaultTitle = () => {
    switch (type) {
      case 'error':
        return 'Erro';
      case 'success':
        return 'Sucesso';
      case 'info':
        return 'Informação';
      case 'confirm':
        return 'Confirmar';
      default:
        return 'Aviso';
    }
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    if (onClose) onClose();
  };

  const content = (
    <div className={styles.alertPortalContainer} role="dialog" aria-modal="false">
      <div className={`${styles.alertBox} ${getCardVariantClass()}`}>
        <div className={styles.alertHeader}>
          <div className={styles.titleWrapper}>
            {renderIcon()}
            <h3 className={styles.title}>{title || defaultTitle()}</h3>
          </div>
          <button 
            type="button" 
            className={styles.closeBtn} 
            onClick={onClose} 
            aria-label="Fechar alerta"
          >
            <FaTimes />
          </button>
        </div>

        <div className={styles.alertBody}>
          {typeof message === 'string' ? <p>{message}</p> : message}
        </div>

        <div className={styles.alertFooter}>
          {type === 'confirm' ? (
            <>
              <button 
                type="button" 
                className={styles.btnCancel} 
                onClick={onClose}
              >
                {cancelText || 'Cancelar'}
              </button>
              <button 
                type="button" 
                className={styles.btnConfirm} 
                onClick={handleConfirm}
              >
                {confirmText || 'Confirmar'}
              </button>
            </>
          ) : (
            <button 
              type="button" 
              className={styles.btnConfirm} 
              onClick={onClose}
            >
              {confirmText || 'Entendi'}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
