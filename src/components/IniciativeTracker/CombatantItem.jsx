import React from 'react';
import { 
  FaShieldAlt, FaSkull, FaChevronUp, FaChevronDown, FaTrash, 
  FaEdit, FaCheck, FaTimes, FaMinus, FaPlus 
} from 'react-icons/fa';
import { CONDICOES_DISPONIVEIS, getCondicaoIcon } from '../../constants/condicoes';

export default function CombatantItem({
  p,
  index,
  totalParticipantes,
  isMestre,
  isEditando,
  editForm,
  setEditForm,
  fichasDisponiveis,
  onToggleTurno,
  // onIniciarEdicao,
  onSalvarEdicao,
  onCancelarEdicao,
  onMoverItem,
  onIniciarExclusao,
  onAlterarRecurso,
  onToggleCondicao
}) {
  const estaDerrotado = p.hp_atual === 0;
  const emCrise = !estaDerrotado && p.hp_atual <= p.hp_max / 2;
  const danoInimigo = p.hp_max - p.hp_atual;
  const condicoesAtivas = p.condicoes || [];

  const fichaCorrespondente = fichasDisponiveis.find(
    f => f.id === p.ficha_id || f.nome_personagem.toLowerCase() === p.nome.toLowerCase()
  );
  const avatarUrl = fichaCorrespondente?.avatar_url;
  const defesaHeroi = fichaCorrespondente?.defesa || 10;
  const mdefHeroi = fichaCorrespondente?.mdef || 10;

  return (
    <div
      className={`participante-item ${p.tipo} ${p.agiu ? 'turn-completed' : ''} ${estaDerrotado ? 'is-defeated' : ''}`}
      onClick={() => !isEditando && onToggleTurno(p.id, p.agiu)}
    >
      {/* LINHA 1: Identidade, Nome, Badges de Estado e Controles */}
      <div className="item-main-row">
        <input type="checkbox" checked={p.agiu} readOnly />

        {avatarUrl ? (
          <img src={avatarUrl} alt={p.nome} className="avatar-img" />
        ) : (
          <div className="avatar-placeholder">
            {p.tipo === 'heroi' ? <FaShieldAlt size={14} /> : <FaSkull size={14} />}
          </div>
        )}

        {isEditando ? (
          <input
            type="text"
            value={editForm.nome}
            onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            className="input-edit-nome"
          />
        ) : (
          <div className="info-principal-wrapper">
            <span className="nome">{p.nome}</span>
            <div className="badges-estado-inline">
              {estaDerrotado && <span className="badge-derrotado">CAÍDO</span>}
              {emCrise && <span className="badge-crise">CRISE</span>}
              <span className={`badge ${p.tipo}`}>
                {p.tipo === 'heroi' ? <><FaShieldAlt /> Herói</> : <><FaSkull /> Inimigo</>}
              </span>
            </div>
          </div>
        )}

        {isMestre && (
          <div className="item-controls" onClick={(e) => e.stopPropagation()}>
            {isEditando ? (
              <>
                <button className="btn-save-edit" onClick={() => onSalvarEdicao(p.id)} title="Salvar"><FaCheck /></button>
                <button className="btn-cancel-edit" onClick={onCancelarEdicao} title="Cancelar"><FaTimes /></button>
              </>
            ) : (
              <>
                {/* <button onClick={() => onIniciarEdicao(p)} title="Editar Cartão"><FaEdit /></button> */}
                <button disabled={index === 0} onClick={() => onMoverItem(index, 'cima')} title="Subir"><FaChevronUp /></button>
                <button disabled={index === totalParticipantes - 1} onClick={() => onMoverItem(index, 'baixo')} title="Descer"><FaChevronDown /></button>
                <button className="btn-delete-part" onClick={() => onIniciarExclusao(p)} title="Remover"><FaTrash /></button>
              </>
            )}
          </div>
        )}
      </div>

      {/* LINHA 2: Condições Ativas (Casoexista) */}
      {condicoesAtivas.length > 0 && !isEditando && (
        <div className="condicoes-strip">
          {condicoesAtivas.map(cId => {
            const condObj = CONDICOES_DISPONIVEIS.find(item => item.id === cId);
            return (
              <span key={cId} className={`condicao-chip cond-${cId}`}>
                {getCondicaoIcon(cId)}
                <span>{condObj?.label}</span>
              </span>
            );
          })}
        </div>
      )}

      {/* LINHA 3: Estatísticas Públicas (Compactas e Organizadas) */}
      {!isEditando && p.tipo === 'heroi' && (
        <div className="stats-badges-public-grid">
          <div className="stat-bar-wrapper">
            <div className="stat-bar-header">
              <span>❤️ HP: {p.hp_atual}/{p.hp_max}</span>
            </div>
            <div className="barra-container">
              <div
                className={`barra-hp-fill ${estaDerrotado ? 'derrotado' : emCrise ? 'em-crise' : ''}`}
                style={{ width: `${Math.max(0, Math.min(100, (p.hp_atual / p.hp_max) * 100))}%` }}
              />
            </div>
          </div>

          <div className="stat-bar-wrapper">
            <div className="stat-bar-header">
              <span>💧 MP: {p.mp_atual}/{p.mp_max}</span>
            </div>
            <div className="barra-container">
              <div
                className="barra-mp-fill"
                style={{ width: `${Math.max(0, Math.min(100, (p.mp_atual / p.mp_max) * 100))}%` }}
              />
            </div>
          </div>

          <div className="badges-row">
            <span className="badge-info ip-badge">📦 IP: {p.ip}</span>
            <span className="badge-info def-badge">🛡️ DEF: {defesaHeroi}</span>
            <span className="badge-info mdef-badge">🔮 M.DEF: {mdefHeroi}</span>
            <span className="badge-info fabula-badge">✨ Fábula: {p.pontos_fabula}</span>
          </div>
        </div>
      )}

      {!isEditando && p.tipo === 'inimigo' && (
        <div className="stats-badges-public">
          <span className="badge-info dano-badge">💥 Dano Acumulado: {danoInimigo}</span>
        </div>
      )}

      {/* PAINEL DE CONTROLE DO MESTRE (Abaixo dos dados do combatente) */}
      {isMestre && !isEditando && (
        <div className="mestre-stats-bar" onClick={(e) => e.stopPropagation()}>
          <div className="mestre-stats-bar-row">
            <div className="stat-group-barra">
              <div className="stat-bar-header"><span>Ajustar HP ({p.hp_atual}/{p.hp_max})</span></div>
              <div className="barra-container">
                <div
                  className={`barra-hp-fill ${estaDerrotado ? 'derrotado' : emCrise ? 'em-crise' : ''}`}
                  style={{ width: `${Math.max(0, Math.min(100, (p.hp_atual / p.hp_max) * 100))}%` }}
                />
              </div>
              <div className="btn-group-delta">
                <button onClick={() => onAlterarRecurso(p.id, 'hp_atual', p.hp_atual, -5, p.hp_max)}>-5</button>
                <button onClick={() => onAlterarRecurso(p.id, 'hp_atual', p.hp_atual, -1, p.hp_max)}><FaMinus /></button>
                <button onClick={() => onAlterarRecurso(p.id, 'hp_atual', p.hp_atual, 1, p.hp_max)}><FaPlus /></button>
                <button onClick={() => onAlterarRecurso(p.id, 'hp_atual', p.hp_atual, 5, p.hp_max)}>+5</button>
              </div>
            </div>

            <div className="stat-group-barra">
              <div className="stat-bar-header"><span>Ajustar MP ({p.mp_atual}/{p.mp_max})</span></div>
              <div className="barra-container">
                <div
                  className="barra-mp-fill"
                  style={{ width: `${Math.max(0, Math.min(100, (p.mp_atual / p.mp_max) * 100))}%` }}
                />
              </div>
              <div className="btn-group-delta">
                <button onClick={() => onAlterarRecurso(p.id, 'mp_atual', p.mp_atual, -5, p.mp_max)}>-5</button>
                <button onClick={() => onAlterarRecurso(p.id, 'mp_atual', p.mp_atual, -1, p.mp_max)}><FaMinus /></button>
                <button onClick={() => onAlterarRecurso(p.id, 'mp_atual', p.mp_atual, 1, p.mp_max)}><FaPlus /></button>
                <button onClick={() => onAlterarRecurso(p.id, 'mp_atual', p.mp_atual, 5, p.mp_max)}>+5</button>
              </div>
            </div>

            {p.tipo === 'heroi' && (
              <>
                <div className="stat-group">
                  <span className="stat-label">IP: {p.ip}</span>
                  <button onClick={() => onAlterarRecurso(p.id, 'ip', p.ip, -1)}><FaMinus /></button>
                  <button onClick={() => onAlterarRecurso(p.id, 'ip', p.ip, 1)}><FaPlus /></button>
                </div>
                <div className="stat-group">
                  <span className="stat-label">✨ Fábula: {p.pontos_fabula}</span>
                  <button onClick={() => onAlterarRecurso(p.id, 'pontos_fabula', p.pontos_fabula, -1)}><FaMinus /></button>
                  <button onClick={() => onAlterarRecurso(p.id, 'pontos_fabula', p.pontos_fabula, 1)}><FaPlus /></button>
                </div>
              </>
            )}
          </div>

          <div className="condicoes-selector-group">
            <span className="stat-label">Gerenciar Condições:</span>
            <div className="condicoes-buttons">
              {CONDICOES_DISPONIVEIS.map(c => {
                const ativo = condicoesAtivas.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`cond-btn ${ativo ? 'active' : ''}`}
                    onClick={() => onToggleCondicao(p, c.id)}
                  >
                    {c.icon}
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}