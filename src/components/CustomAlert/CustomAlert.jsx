import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import './CustomAlert.css';

export default function CustomAlert({ isOpen, title, message, onClose, onConfirm, type = 'alert' }) {
  if (!isOpen) return null;

  return (
    <div className="custom-alert-overlay" onClick={onClose}>
      <div className="custom-alert-box" onClick={(e) => e.stopPropagation()}>
        <div className="custom-alert-header">
          <div className="alert-title-wrapper">
            <FaExclamationTriangle className="alert-icon" />
            <h3>{title || 'Aviso'}</h3>
          </div>
          <button className="alert-close-btn" onClick={onClose}><FaTimes /></button>
        </div>

        <div className="custom-alert-body">
          <p>{message}</p>
        </div>

        <div className="custom-alert-footer">
          {type === 'confirm' ? (
            <>
              <button className="btn-alert-cancel" onClick={onClose}>Cancelar</button>
              <button className="btn-alert-confirm" onClick={() => { onConfirm(); onClose(); }}>Confirmar</button>
            </>
          ) : (
            <button className="btn-alert-confirm" onClick={onClose}>Entendi</button>
          )}
        </div>
      </div>
    </div>
  );
}