import TitanRotasManager from '../TitanRotasManager/TitanRotasManager';
import TitanContratosManager from '../TitanContratosManager/TitanContratosManager';
import './TitanDetailSidebar.css';
import { FaTimes } from 'react-icons/fa';

export default function TitanDetailSidebar({ titan, isMestre, onClose, onStatusChange }) {
  if (!titan) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pacifico': return { label: '🟢 Pacífico / Ativo', class: 'status-pacifico' };
      case 'perigo': return { label: '🔴 Sob Cerco / Perigo', class: 'status-perigo' };
      case 'corrompido': return { label: '🟣 Corrompido / Mágico', class: 'status-corrompido' };
      case 'caido': return { label: '⚫ Caído / Destruído', class: 'status-caido' };
      default: return { label: '🟢 Pacífico', class: 'status-pacifico' };
    }
  };

  return (
    <aside className="titan-sidebar">
      <div className="titan-sidebar-header">
        <span className="modal-faccao">{titan.faccao}</span>
        <button className="sidebar-close-btn" onClick={onClose}><FaTimes /></button>
      </div>

      <div className="titan-sidebar-content">
        {/* Status Geopolítico */}
        <div className="titan-status-section">
          {isMestre ? (
            <select
              className={`modal-status-select ${getStatusBadge(titan.status).class}`}
              value={titan.status}
              onChange={(e) => onStatusChange(titan.id, e.target.value)}
            >
              <option value="pacifico">🟢 Pacífico / Ativo</option>
              <option value="perigo">🔴 Sob Cerco / Perigo</option>
              <option value="corrompido">🟣 Corrompido / Mágico</option>
              <option value="caido">⚫ Caído / Destruído</option>
            </select>
          ) : (
            <span className={`modal-status-tag ${getStatusBadge(titan.status).class}`}>
              {getStatusBadge(titan.status).label}
            </span>
          )}
        </div>

        <h2>{titan.titulo}</h2>
        <p className="titan-descricao">{titan.descricao}</p>

        <div className="titan-lore-details">
          {titan.industria && <p><strong>Indústria:</strong> {titan.industria}</p>}
          {titan.habitantes && <p><strong>Habitantes:</strong> {titan.habitantes}</p>}
          {titan.sociedade && <p><strong>Sociedade:</strong> {titan.sociedade}</p>}
          {titan.funcao && <p><strong>Função:</strong> {titan.funcao}</p>}
          {titan.seguranca && <p><strong>Segurança:</strong> {titan.seguranca}</p>}
          {titan.cultura && <p><strong>Cultura:</strong> {titan.cultura}</p>}
          {titan.destaque && <p><strong>Destaque:</strong> {titan.destaque}</p>}
        </div>

        <hr className="titan-divider" />

        {/* --- GERENCIADOR DE CONTRATOS --- */}
        <TitanContratosManager titan={titan} isMestre={isMestre} />

        <hr className="titan-divider" />

        {/* --- GERENCIADOR DE ROTAS AÉREAS --- */}
        <TitanRotasManager titan={titan} isMestre={isMestre} />
      </div>
    </aside>
  );
}