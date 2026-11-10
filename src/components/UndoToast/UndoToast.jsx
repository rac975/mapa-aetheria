import { FaUndo } from 'react-icons/fa';
import './UndoToast.css';

export default function UndoToast({ mostrar, mensagem, progressoKey, onUndo }) {
  if (!mostrar) return null;

  return (
    <div className="undo-toast-container">
      <div className="undo-toast-content">
        <span>{mensagem}</span>
        <button className="btn-undo" onClick={onUndo}>
          <FaUndo /> Desfazer
        </button>
      </div>
      <div key={progressoKey} className="undo-progress-bar"></div>
    </div>
  );
}