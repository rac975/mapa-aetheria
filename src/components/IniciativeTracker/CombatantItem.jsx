import { useState, useEffect, useRef } from 'react';
import {
  FaShieldAlt, FaSkull, FaChevronUp, FaChevronDown, FaTrashAlt,
  FaCheck, FaTimes, FaHeartbeat, FaMagic,
  FaStar, FaBoxOpen, FaPlay, FaSlidersH, FaExclamationTriangle, FaDice
} from 'react-icons/fa';
import { Badge, Button, Input, ResourceBar } from '../ui';
import { CONDICOES_DISPONIVEIS, getCondicaoIcon } from '../../constants/condicoes';
import {
  estaDerrotado as checkDerrotado,
  calcularStatusCrise,
  calcularDanoAcumulado
} from '../../domain/fabula/combatRules';
import CombatantDiceDrawer from './CombatantDiceDrawer';
import CombatantDrawers from './CombatantDrawers';
import styles from './CombatantItem.module.css';

export default function CombatantItem({
  p,
  index,
  totalParticipantes,
  participantes = [],
  isMestre,
  isEditando,
  editForm,
  setEditForm,
  fichasDisponiveis,
  perfilRolagem,
  onToggleTurno,
  onAtivarTurno,
  onSalvarEdicao,
  onCancelarEdicao,
  onMoverItem,
  onIniciarExclusao,
  onAlterarRecurso,
  onToggleCondicao,
  onRolarDados
}) {
  // 'dados' | 'recursos' | 'condicoes' | null
  const [painelAberto, setPainelAberto] = useState(null);
  const cardRef = useRef(null);

  const estaDerrotado = checkDerrotado(p.hp_atual);
  const emCrise = calcularStatusCrise(p.hp_atual, p.hp_max);
  const danoInimigo = calcularDanoAcumulado(p.hp_atual, p.hp_max);
  const condicoesAtivas = p.condicoes || [];

  useEffect(() => {
    if (!painelAberto) return;
    const handleClickOutside = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) {
        setPainelAberto(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [painelAberto]);

  const fichaCorrespondente = fichasDisponiveis.find(
    (f) => f.id === p.ficha_id || f.nome_personagem?.toLowerCase() === p.nome?.toLowerCase()
  );
  const avatarUrl = fichaCorrespondente?.avatar_url;
  const defesaHeroi = perfilRolagem?.defesa || fichaCorrespondente?.defesa || 10;
  const mdefHeroi = perfilRolagem?.mdef || fichaCorrespondente?.mdef || 10;
  const podeRolarDados = isMestre || p.tipo === 'heroi';

  const alvoProtegido = p.protegendo_id
    ? participantes.find((item) => String(item.id) === String(p.protegendo_id))
    : null;

  const alternarPainel = (tipo) => {
    setPainelAberto((atual) => (atual === tipo ? null : tipo));
  };

  const itemClasses = [
    styles.itemCard,
    p.tipo === 'heroi' ? styles.heroi : styles.inimigo,
    p.turno_atual && !estaDerrotado ? styles.turnActiveCard : '',
    p.agiu ? styles.turnCompleted : '',
    estaDerrotado ? styles.isDefeated : ''
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={cardRef}
      className={itemClasses}
      onClick={() => !isEditando && onToggleTurno(p.id, p.agiu)}
    >
      <div className={styles.itemMainRow}>
        <div className={styles.identityCluster}>
          <input
            type="checkbox"
            checked={p.agiu}
            readOnly
            className={styles.turnCheckbox}
            aria-label={`Status de turno de ${p.nome}`}
          />

          {avatarUrl ? (
            <img src={avatarUrl} alt={p.nome} className={styles.avatarImg} />
          ) : (
            <div className={styles.avatarPlaceholder}>
              {p.tipo === 'heroi' ? <FaShieldAlt size={14} /> : <FaSkull size={14} />}
            </div>
          )}

          {isEditando ? (
            <div className={styles.editInputWrapper} onClick={(e) => e.stopPropagation()}>
              <Input
                value={editForm.nome}
                onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                placeholder="Nome do combatente"
              />
            </div>
          ) : (
            <div className={styles.nameAndBadges}>
              <div className={styles.nameLine}>
                <span className={styles.nome}>{p.nome}</span>
                <Badge variant={p.tipo === 'heroi' ? 'core' : 'crise'} size="sm">
                  {p.tipo === 'heroi' ? 'Herói' : 'Inimigo'}
                </Badge>
                {p.turno_atual && !estaDerrotado && (
                  <Badge variant="gold" size="sm"><FaPlay /> NO TURNO</Badge>
                )}
                {p.guardando && !estaDerrotado && (
                  <Badge variant="ether" size="sm">
                    <FaShieldAlt /> {alvoProtegido ? `Cobre ${alvoProtegido.nome}` : 'Em Guarda'}
                  </Badge>
                )}
                {estaDerrotado && <Badge variant="default" size="sm">CAÍDO</Badge>}
                {emCrise && !estaDerrotado && <Badge variant="crise" size="sm">CRISE</Badge>}
              </div>

              {condicoesAtivas.length > 0 && (
                <div className={styles.condicoesStrip} onClick={(e) => e.stopPropagation()}>
                  {condicoesAtivas.map((cId) => {
                    const condObj = CONDICOES_DISPONIVEIS.find((item) => item.id === cId);
                    return (
                      <button
                        key={cId}
                        type="button"
                        className={`${styles.condicaoChip} ${styles['cond_' + cId] || ''}`}
                        onClick={() => isMestre && onToggleCondicao(p, cId)}
                        title={isMestre ? `${condObj?.label || cId} (clique para remover)` : (condObj?.label || cId)}
                      >
                        {getCondicaoIcon(cId)}
                        <span>{condObj?.label?.split(' ')[0] || cId}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {!isEditando && (
          <div className={styles.vitalsCluster} onClick={(e) => isMestre && e.stopPropagation()}>
            {(p.tipo === 'heroi' || isMestre) && (
              <div className={styles.barsInline}>
                <div className={styles.barCompact}>
                  <ResourceBar type="pv" current={p.hp_atual} max={p.hp_max} label="PV" isCrise={emCrise} />
                </div>
                <div className={styles.barCompact}>
                  <ResourceBar type="pm" current={p.mp_atual} max={p.mp_max} label="PM" />
                </div>
              </div>
            )}

            {p.tipo === 'heroi' ? (
              <div className={styles.pillsInline}>
                <span className={styles.statPill} title="Defesa Física"><FaShieldAlt /> DEF {defesaHeroi}</span>
                <span className={styles.statPill} title="Defesa Mágica"><FaMagic /> M.DEF {mdefHeroi}</span>
                <span className={styles.statPill} title="Pontos de Inventário"><FaBoxOpen /> IP {p.ip}</span>
                <span className={`${styles.statPill} ${styles.statPillGold}`} title="Pontos de Fábula"><FaStar /> PF {p.pontos_fabula}</span>
              </div>
            ) : (
              <div className={styles.pillsInline}>
                {isMestre && perfilRolagem && (
                  <>
                    <span className={styles.statPill} title="Defesa Física"><FaShieldAlt /> DEF {perfilRolagem.defesa}</span>
                    <span className={styles.statPill} title="Defesa Mágica"><FaMagic /> M.DEF {perfilRolagem.mdef}</span>
                  </>
                )}
                <Badge variant="crise" size="sm">
                  <FaHeartbeat /> Dano: {danoInimigo}
                </Badge>
              </div>
            )}
          </div>
        )}

        <div className={`${styles.actionsCluster} ${styles.noPrint}`} onClick={(e) => e.stopPropagation()}>
          {!isEditando && !estaDerrotado && !p.agiu && onAtivarTurno && (
            <button
              type="button"
              className={`${styles.actionIconBtn} ${p.turno_atual ? styles.actionIconBtnGold : ''}`}
              onClick={() => onAtivarTurno(p)}
              title="Definir como turno ativo atual"
            >
              <FaPlay />
            </button>
          )}

          {!isEditando && podeRolarDados && onRolarDados && (
            <button
              type="button"
              className={`${styles.actionIconBtn} ${painelAberto === 'dados' ? styles.actionIconBtnActive : ''}`}
              onClick={() => alternarPainel('dados')}
              title="Rolar dados de Atributos, Armas ou Magias da ficha"
              aria-expanded={painelAberto === 'dados'}
            >
              <FaDice />
              <span className={styles.btnLabelDesktop}>Dados</span>
            </button>
          )}

          {isMestre && !isEditando && (
            <>
              <button
                type="button"
                className={`${styles.actionIconBtn} ${painelAberto === 'recursos' ? styles.actionIconBtnActive : ''}`}
                onClick={() => alternarPainel('recursos')}
                title="Ajustar PV, PM, IP e Fábula"
                aria-expanded={painelAberto === 'recursos'}
              >
                <FaSlidersH />
                <span className={styles.btnLabelDesktop}>PV/PM</span>
              </button>

              <button
                type="button"
                className={`${styles.actionIconBtn} ${painelAberto === 'condicoes' ? styles.actionIconBtnActive : ''} ${condicoesAtivas.length > 0 ? styles.actionIconBtnHasCond : ''}`}
                onClick={() => alternarPainel('condicoes')}
                title="Gerenciar Condições"
                aria-expanded={painelAberto === 'condicoes'}
              >
                <FaExclamationTriangle />
                <span className={styles.btnLabelDesktop}>Status</span>
                {condicoesAtivas.length > 0 && (
                  <span className={styles.condCountBadge}>{condicoesAtivas.length}</span>
                )}
              </button>

              <div className={styles.orderControls}>
                <button type="button" disabled={index === 0} onClick={() => onMoverItem(index, 'cima')} title="Subir na ordem" className={styles.miniControlBtn}><FaChevronUp /></button>
                <button type="button" disabled={index === totalParticipantes - 1} onClick={() => onMoverItem(index, 'baixo')} title="Descer na ordem" className={styles.miniControlBtn}><FaChevronDown /></button>
                <button type="button" className={`${styles.miniControlBtn} ${styles.deleteBtn}`} onClick={() => onIniciarExclusao(p)} title="Remover da cena"><FaTrashAlt /></button>
              </div>
            </>
          )}

          {isMestre && isEditando && (
            <>
              <Button variant="core" size="sm" onClick={() => onSalvarEdicao(p.id)} title="Salvar"><FaCheck /></Button>
              <Button variant="danger" size="sm" onClick={onCancelarEdicao} title="Cancelar"><FaTimes /></Button>
            </>
          )}
        </div>
      </div>

      {!isEditando && painelAberto === 'dados' && podeRolarDados && (
        <CombatantDiceDrawer
          combatente={p}
          perfil={perfilRolagem}
          onRolarDados={onRolarDados}
          onFechar={() => setPainelAberto(null)}
        />
      )}

      {isMestre && !isEditando && (painelAberto === 'recursos' || painelAberto === 'condicoes') && (
        <CombatantDrawers
          p={p}
          painelAberto={painelAberto}
          condicoesAtivas={condicoesAtivas}
          onFechar={() => setPainelAberto(null)}
          onAlterarRecurso={onAlterarRecurso}
          onToggleCondicao={onToggleCondicao}
        />
      )}
    </div>
  );
}
