import { FaEdit, FaTrash } from 'react-icons/fa';
import './CronicasCard.css';

export default function CronicaCard({ cronica, isMestre, onEditar, onExcluir }) {
  return (
    <div className="cronica-card">
      <div className="cronica-card-header">
        <span className="cronica-sessao">{cronica.sessao}</span>
        <span className="cronica-data">
          {cronica.data ? new Date(cronica.data + 'T00:00:00').toLocaleDateString('pt-BR') : ''}
        </span>
      </div>
      <h2>{cronica.titulo}</h2>
      <p className="cronica-texto">{cronica.conteudo}</p>
      
      {cronica.tags && (
        <div className="cronica-tags-container">
          {cronica.tags.split(',').map((t, idx) => (
            <span key={idx} className="cronica-tag-badge">#{t.trim()}</span>
          ))}
        </div>
      )}

      {isMestre && (
        <div className="cronica-actions">
          <button onClick={() => onEditar(cronica)} title="Editar Crônica">
            <FaEdit /> Editar
          </button>
          <button className="btn-delete" onClick={() => onExcluir(cronica.id)} title="Excluir Crônica">
            <FaTrash /> Excluir
          </button>
        </div>
      )}
    </div>
  );
}