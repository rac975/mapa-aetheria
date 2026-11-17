import React from 'react';
import {
  FaShieldAlt, FaSkull, FaChevronUp, FaChevronDown, FaTrashAlt,
  FaCheck, FaTimes, FaMinus, FaPlus, FaHeartbeat, FaMagic, FaStar, FaBoxOpen, FaPlay
} from 'react-icons/fa';
import { Badge, Button, Input, ResourceBar } from '../ui';
import { CONDICOES_DISPONIVEIS, getCondicaoIcon } from '../../constants/condicoes';
import { estaDerrotado as checkDerrotado, calcularStatusCrise, calcularDanoAcumulado } from '../../domain/fabula/combatRules';
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
  onToggleTurno,
  onAtivarTurno,
  onSalvarEdicao,
  onCancelarEdicao,
  onMoverItem,
  onIniciarExclusao,
  onAlterarRecurso,
  onToggleCondicao
}) {
  const estaDerrotado = checkDerrotado(p.hp_atual);
  const emCrise = calcularStatusCrise(p.hp_atual, p.hp_max);
  const danoInimigo = calcularDanoAcumulado(p.hp_atual, p.hp_max);
  const condicoesAtivas = p.condicoes || [];

  const fichaCorrespondente = fichasDisponiveis.find(
    (f) => f.id === p.ficha_id || f.nome_personagem?.toLowerCase() === p.nome?.toLowerCase()
  );
  const avatarUrl = fichaCorrespondente?.avatar_url;
  const defesaHeroi = fichaCorrespondente?.defesa || 10;
  const mdefHeroi = fichaCorrespondente?.mdef || 10;

  const alvoProtegido = p.protegendo_id
    ? participantes.find((item) => String(item.id) === String(p.protegendo_id))
    : null;

  const itemClasses = [
    styles.itemCard,
    p.tipo === 'heroi' ? styles.heroi : styles.inimigo,
    p.turno_atual && !estaDerrotado ? styles.turnActiveCard : '',
    p.agiu ? styles.turnCompleted : '',
    estaDerrotado ? styles.isDefeated : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={itemClasses} onClick={() => !isEditando && onToggleTurno(p.id, p.agiu)}>
      <div className={styles.itemMainRow}>
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
            {p.tipo === 'heroi' ? <FaShieldAlt size={15} /> : <FaSkull size={15} />}
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
          <div className={styles.infoPrincipalWrapper}>
            <span className={styles.nome}>{p.nome}</span>
            <div className={styles.badgesEstadoInline}>
              {p.turno_atual && !estaDerrotado && <Badge variant="gold" size="sm"><FaPlay /> NO TURNO</Badge>}
              {p.guardando && !estaDerrotado && (
                <Badge variant="ether" size="sm">
                  <FaShieldAlt /> {alvoProtegido ? `GUARDA (Cobre ${alvoProtegido.nome})` : 'EM GUARDA'}
                </Badge>
              )}
              {estaDerrotado && <Badge variant="default" size="sm">CAÍDO</Badge>}
              {emCrise && !estaDerrotado && <Badge variant="crise" size="sm">CRISE</Badge>}
              <Badge variant={p.tipo === 'heroi' ? 'core' : 'crise'} size="sm">
                {p.tipo === 'heroi' ? <><FaShieldAlt /> Herói</> : <><FaSkull /> Inimigo</>}
              </Badge>
            </div>
          </div>
        )}

        {!isEditando && !estaDerrotado && !p.agiu && onAtivarTurno && (
          <div className={styles.noPrint} onClick={(e) => e.stopPropagation()}>
            <Button
              type="button"
              variant={p.turno_atual ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => onAtivarTurno(p)}
              title="Destacar como turno atual (encerra Guarda anterior)"
            >
              <FaPlay />
            </Button>
          </div>
        )}

        {isMestre && (
          <div className={`${styles.itemControls} ${styles.noPrint}`} onClick={(e) => e.stopPropagation()}>
            {isEditando ? (
              <>
                <Button variant="core" size="sm" onClick={() => onSalvarEdicao(p.id)} title="Salvar" className={styles.iconBtn}><FaCheck /></Button>
                <Button variant="danger" size="sm" onClick={onCancelarEdicao} title="Cancelar" className={styles.iconBtn}><FaTimes /></Button>
              </>
            ) : (
              <>
                <button type="button" disabled={index === 0} onClick={() => onMoverItem(index, 'cima')} title="Subir Ordem" className={styles.controlBtn}><FaChevronUp /></button>
                <button type="button" disabled={index === totalParticipantes - 1} onClick={() => onMoverItem(index, 'baixo')} title="Descer Ordem" className={styles.controlBtn}><FaChevronDown /></button>
                <button type="button" className={`${styles.controlBtn} ${styles.deleteBtn}`} onClick={() => onIniciarExclusao(p)} title="Remover da Cena"><FaTrashAlt /></button>
              </>
            )}
          </div>
        )}
      </div>

      {condicoesAtivas.length > 0 && !isEditando && (
        <div className={styles.condicoesStrip}>
          {condicoesAtivas.map((cId) => {
            const condObj = CONDICOES_DISPONIVEIS.find((item) => item.id === cId);
            return (
              <span key={cId} className={`${styles.condicaoChip} ${styles['cond_' + cId] || ''}`}>
                {getCondicaoIcon(cId)}
                <span>{condObj?.label || cId}</span>
              </span>
            );
          })}
        </div>
      )}

      {!isEditando && p.tipo === 'heroi' && (
        <div className={styles.statsHeroiGrid}>
          <ResourceBar type="pv" current={p.hp_atual} max={p.hp_max} label="PV" isCrise={emCrise} />
          <ResourceBar type="pm" current={p.mp_atual} max={p.mp_max} label="PM" />
          <div className={styles.badgesRow}>
            <Badge variant="pi" size="sm"><FaBoxOpen /> IP: {p.ip}</Badge>
            <Badge variant="default" size="sm"><FaShieldAlt /> DEF: {defesaHeroi}</Badge>
            <Badge variant="ether" size="sm"><FaMagic /> M.DEF: {mdefHeroi}</Badge>
            <Badge variant="gold" size="sm"><FaStar /> Fábula: {p.pontos_fabula}</Badge>
          </div>
        </div>
      )}

      {!isEditando && p.tipo === 'inimigo' && (
        <div className={styles.statsInimigo}>
          <Badge variant="crise" size="md">
            <FaHeartbeat /> Dano Acumulado: {danoInimigo}
          </Badge>
        </div>
      )}

      {isMestre && !isEditando && (
        <div className={`${styles.mestreStatsBar} ${styles.noPrint}`} onClick={(e) => e.stopPropagation()}>
          <div className={styles.mestreStatsBarRow}>
            <div className={styles.statGroupBarra}>
              <ResourceBar type="pv" current={p.hp_atual} max={p.hp_max} label="Ajustar PV" isCrise={emCrise} />
              <div className={styles.btnGroupDelta}>
                <button type="button" className={styles.deltaBtn} onClick={() => onAlterarRecurso(p.id, 'hp_atual', p.hp_atual, -5, p.hp_max)}>-5</button>
                <button type="button" className={styles.deltaBtn} onClick={() => onAlterarRecurso(p.id, 'hp_atual', p.hp_atual, -1, p.hp_max)}><FaMinus /></button>
                <button type="button" className={styles.deltaBtn} onClick={() => onAlterarRecurso(p.id, 'hp_atual', p.hp_atual, 1, p.hp_max)}><FaPlus /></button>
                <button type="button" className={styles.deltaBtn} onClick={() => onAlterarRecurso(p.id, 'hp_atual', p.hp_atual, 5, p.hp_max)}>+5</button>
              </div>
            </div>

            <div className={styles.statGroupBarra}>
              <ResourceBar type="pm" current={p.mp_atual} max={p.mp_max} label="Ajustar PM" />
              <div className={styles.btnGroupDelta}>
                <button type="button" className={styles.deltaBtn} onClick={() => onAlterarRecurso(p.id, 'mp_atual', p.mp_atual, -5, p.mp_max)}>-5</button>
                <button type="button" className={styles.deltaBtn} onClick={() => onAlterarRecurso(p.id, 'mp_atual', p.mp_atual, -1, p.mp_max)}><FaMinus /></button>
                <button type="button" className={styles.deltaBtn} onClick={() => onAlterarRecurso(p.id, 'mp_atual', p.mp_atual, 1, p.mp_max)}><FaPlus /></button>
                <button type="button" className={styles.deltaBtn} onClick={() => onAlterarRecurso(p.id, 'mp_atual', p.mp_atual, 5, p.mp_max)}>+5</button>
              </div>
            </div>

            {p.tipo === 'heroi' && (
              <div className={styles.countersRow}>
                <div className={styles.statGroup}>
                  <span className={styles.statLabel}>IP: {p.ip}</span>
                  <button type="button" className={styles.counterBtn} onClick={() => onAlterarRecurso(p.id, 'ip', p.ip, -1)}><FaMinus /></button>
                  <button type="button" className={styles.counterBtn} onClick={() => onAlterarRecurso(p.id, 'ip', p.ip, 1)}><FaPlus /></button>
                </div>
                <div className={styles.statGroup}>
                  <span className={styles.statLabel}><FaStar /> Fábula: {p.pontos_fabula}</span>
                  <button type="button" className={styles.counterBtn} onClick={() => onAlterarRecurso(p.id, 'pontos_fabula', p.pontos_fabula, -1)}><FaMinus /></button>
                  <button type="button" className={styles.counterBtn} onClick={() => onAlterarRecurso(p.id, 'pontos_fabula', p.pontos_fabula, 1)}><FaPlus /></button>
                </div>
              </div>
            )}
          </div>

          <div className={styles.condicoesSelectorGroup}>
            <span className={styles.condicoesTitle}>Gerenciar Condições:</span>
            <div className={styles.condicoesButtons}>
              {CONDICOES_DISPONIVEIS.map((c) => {
                const ativo = condicoesAtivas.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`${styles.condBtn} ${ativo ? styles.condBtnActive : ''}`}
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
