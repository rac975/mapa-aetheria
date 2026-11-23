import { useState, useEffect, useRef } from 'react';
import { FaShieldAlt, FaSkull, FaCrown, FaBolt, FaFire, FaPlay } from 'react-icons/fa';
import { Badge, Button, Input } from '../ui';
import { CONDICOES_DISPONIVEIS, getCondicaoIcon } from '../../constants/condicoes';
import {
  estaDerrotado as checkDerrotado, calcularStatusCrise, calcularDanoAcumulado,
  extrairHpMax, extrairMpMax, TIPOS_VILAO, normalizarTipoVilao, isVilaoOuChefe, verificarGatilhoTransicaoFase
} from '../../domain/fabula/combatRules';
import CombatantDrawers from './CombatantDrawers';
import VillainCombatDrawer from './VillainCombatDrawer';
import CombatantActionButtons from './CombatantActionButtons';
import CombatantVitalsCluster from './CombatantVitalsCluster';
import CombatantInitiativeControl from './CombatantInitiativeControl';
import CombatantActionSlotsBar from './CombatantActionSlotsBar';
import CombatantCompanionBar from './CombatantCompanionBar';
import styles from './CombatantItem.module.css';
import actionStyles from './CombatantItemActions.module.css';

export default function CombatantItem({
  p, index, participantes = [], isMestre, jogadorFichaId, jogadorNome,
  isEditando, editForm, setEditForm, fichasDisponiveis, perfilRolagem,
  isAtorSelecionado, isAlvoSelecionado,
  onSelecionarCombatente, onAtivarTurno, onSalvarEdicao, onCancelarEdicao,
  onIniciarExclusao, onAlterarRecurso, onAlterarRecursoCompanheiro, onGastarPontoVilao, onTransicionarFase,
  onAjustarAcaoTurno, onAjustarAcaoSlot, onToggleCondicao,
  onAtualizarIniciativa, onRolarIniciativa, isDragging, isDragOver, dragDropPos = null,
  onDragHandleDown, onDragHandleMove, onDragHandleUp, onDragHandleCancel
}) {
  const [painelAberto, setPainelAberto] = useState(null);
  const cardRef = useRef(null);

  const maxHp = extrairHpMax(p);
  const maxMp = extrairMpMax(p);
  const estaDerrotado = checkDerrotado(p.hp_atual);
  const emCrise = calcularStatusCrise(p.hp_atual, maxHp);
  const danoInimigo = calcularDanoAcumulado(p.hp_atual, maxHp);
  const condicoesAtivas = p.condicoes || [];

  const ehMeuPersonagem = !isMestre && Boolean(
    (jogadorFichaId && String(p.ficha_id) === jogadorFichaId) ||
    (jogadorNome && p.nome?.trim().toLowerCase() === jogadorNome?.trim().toLowerCase())
  );
  const podeAlterarTurno = isMestre || ehMeuPersonagem;

  const isInimigo = p.tipo !== 'heroi';
  const tipoVilaoKey = isInimigo ? normalizarTipoVilao(p.tipo_vilao || 'padrao') : 'padrao';
  const infoVilao = TIPOS_VILAO[tipoVilaoKey] || TIPOS_VILAO.padrao;
  const pontosVilao = isInimigo ? Math.max(0, Number(p.pontos_vilao ?? p.pontos_ultima) || 0) : 0;
  const acoesPorTurno = isInimigo ? Math.max(1, Number(p.acoes_por_turno) || 1) : 1;
  const acoesRealizadas = isInimigo ? Math.max(0, Number(p.modificadores?.acoes_realizadas_rodada) || 0) : 0;
  const ehChefeOuVilao = isInimigo && isVilaoOuChefe(p);
  const ehVoador = Boolean(p.voador || p.modificadores?.voador);
  const rankInimigo = isInimigo ? (p.rank || perfilRolagem?.rank || null) : null;

  const statusFase = isInimigo
    ? verificarGatilhoTransicaoFase({ hpAtual: p.hp_atual, hpMax: maxHp, faseAtual: p.fase_atual || 1, fasesChefao: p.fases_chefao || [] })
    : { temFases: false, gatilhoAtivo: false, proximaFaseObj: null };

  useEffect(() => {
    if (!painelAberto) return;
    const handleClickOutside = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) setPainelAberto(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [painelAberto]);

  const fichaCorrespondente = fichasDisponiveis.find((f) => f.id === p.ficha_id || f.nome_personagem?.toLowerCase() === p.nome?.toLowerCase());
  const avatarUrl = fichaCorrespondente?.avatar_url;
  const defesaHeroi = perfilRolagem?.defesa || fichaCorrespondente?.defesa || 10;
  const mdefHeroi = perfilRolagem?.mdef || fichaCorrespondente?.mdef || 10;
  const alvoProtegido = p.protegendo_id ? participantes.find((item) => String(item.id) === String(p.protegendo_id)) : null;
  const alternarPainel = (tipo) => setPainelAberto((atual) => (atual === tipo ? null : tipo));

  const itemClasses = [
    styles.itemCard,
    p.tipo === 'heroi' ? styles.heroi : styles.inimigo,
    ehChefeOuVilao && styles.vilaoBossCard,
    p.turno_atual && !estaDerrotado && styles.turnActiveCard,
    p.agiu && styles.turnCompleted,
    estaDerrotado && !statusFase.gatilhoAtivo && styles.isDefeated,
    ehMeuPersonagem && styles.meuHeroiCard,
    isAtorSelecionado && styles.actorSelectedCard,
    isAlvoSelecionado && styles.targetSelectedCard,
    isDragging && styles.itemDragging,
    isDragOver && (dragDropPos === 'bottom' ? styles.itemDragOverBottom : styles.itemDragOver)
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={cardRef}
      data-combatant-index={index}
      className={itemClasses}
      onClick={() => !isEditando && onSelecionarCombatente?.(p)}
    >
      <div className={styles.itemMainRow}>
        <div className={styles.identityCluster}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={p.nome} className={styles.avatarImg} />
          ) : (
            <div className={`${styles.avatarPlaceholder} ${ehChefeOuVilao ? styles.avatarBoss : ''}`}>
              {p.tipo === 'heroi' ? <FaShieldAlt size={14} /> : ehChefeOuVilao ? <FaCrown size={14} /> : <FaSkull size={14} />}
            </div>
          )}

          {isEditando ? (
            <div className={styles.editInputWrapper} onClick={(e) => e.stopPropagation()}>
              <Input value={editForm.nome} onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })} placeholder="Nome do combatente" />
            </div>
          ) : (
            <div className={styles.nameAndBadges}>
              <div className={styles.nameLine}>
                <span className={styles.nome}>{p.nome}</span>
                <CombatantInitiativeControl
                  p={p} isMestre={isMestre} ehMeuPersonagem={ehMeuPersonagem} perfilRolagem={perfilRolagem}
                  onAtualizarIniciativa={onAtualizarIniciativa} onRolarIniciativa={onRolarIniciativa}
                />
                {ehMeuPersonagem && <Badge variant="gold" size="sm">★ Meu Herói</Badge>}
                {isAlvoSelecionado && <Badge variant="crise" size="sm">🎯 ALVO</Badge>}
                <Badge variant={p.tipo === 'heroi' ? 'core' : ehChefeOuVilao ? 'villain' : 'crise'} size="sm">
                  {p.tipo === 'heroi' ? 'Herói' : tipoVilaoKey !== 'padrao' ? infoVilao.badgeLabel : 'Inimigo'}
                </Badge>
                {isInimigo && (rankInimigo === 'elite' || rankInimigo === 'campeao') && (
                  <Badge variant={rankInimigo === 'campeao' ? 'villain' : 'gold'} size="sm">
                    {rankInimigo === 'campeao' ? '👑 Campeão' : '⚔️ Elite'}
                  </Badge>
                )}
                {ehVoador && <Badge variant="ether" size="sm" title="Criatura Voadora">🦅 Voador</Badge>}
                {isInimigo && acoesPorTurno > 1 && (
                  <Badge variant="gold" size="sm" title="Multi-Ações"><FaBolt /> {acoesRealizadas}/{acoesPorTurno} Ações</Badge>
                )}
                {statusFase.temFases && <Badge variant="villain" size="sm"><FaFire /> Fase {statusFase.faseAtual}/{statusFase.totalFases}</Badge>}
                {p.turno_atual && !estaDerrotado && <Badge variant="gold" size="sm"><FaPlay /> NO TURNO</Badge>}
                {p.guardando && !estaDerrotado && (
                  <Badge variant="ether" size="sm"><FaShieldAlt /> {alvoProtegido ? `Cobre ${alvoProtegido.nome}` : 'Em Guarda'}</Badge>
                )}
                {p.fugiu && <Badge variant="ether" size="sm">💨 FUGIU</Badge>}
                {p.modificadores?.invisivel && <Badge variant="ether" size="sm">🌫️ INVISÍVEL</Badge>}
                {p.agiu && <Badge variant="default" size="sm">AGIU</Badge>}
                {estaDerrotado && !statusFase.gatilhoAtivo && <Badge variant="default" size="sm">CAÍDO</Badge>}
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
                        onClick={() => podeAlterarTurno && onToggleCondicao(p, cId)}
                        title={podeAlterarTurno ? `${condObj?.label || cId} (clique para remover)` : (condObj?.label || cId)}
                      >
                        {getCondicaoIcon(cId)} <span>{condObj?.label?.split(' ')[0] || cId}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {!isEditando && (
          <CombatantVitalsCluster
            p={p}
            isMestre={isMestre}
            maxHp={maxHp}
            maxMp={maxMp}
            emCrise={emCrise}
            defesaHeroi={defesaHeroi}
            mdefHeroi={mdefHeroi}
            perfilRolagem={perfilRolagem}
            ehChefeOuVilao={ehChefeOuVilao}
            pontosVilao={pontosVilao}
            danoInimigo={danoInimigo}
          />
        )}

        <CombatantActionButtons
          p={p}
          index={index}
          isMestre={isMestre}
          ehMeuPersonagem={ehMeuPersonagem}
          isEditando={isEditando}
          estaDerrotado={estaDerrotado}
          isInimigo={isInimigo}
          painelAberto={painelAberto}
          alternarPainel={alternarPainel}
          condicoesAtivas={condicoesAtivas}
          onAtivarTurno={onAtivarTurno}
          onSalvarEdicao={onSalvarEdicao}
          onCancelarEdicao={onCancelarEdicao}
          onIniciarExclusao={onIniciarExclusao}
          onDragHandleDown={onDragHandleDown}
          onDragHandleMove={onDragHandleMove}
          onDragHandleUp={onDragHandleUp}
          onDragHandleCancel={onDragHandleCancel}
        />
      </div>

      {perfilRolagem?.companheiro && (
        <CombatantCompanionBar
          companheiro={perfilRolagem.companheiro}
          podeEditar={podeAlterarTurno}
          onAlterarRecurso={onAlterarRecursoCompanheiro}
        />
      )}

      {isInimigo && acoesPorTurno > 1 && !estaDerrotado && (
        <CombatantActionSlotsBar p={p} isMestre={isMestre} onAjustarAcaoSlot={onAjustarAcaoSlot || onAjustarAcaoTurno} />
      )}

      {isMestre && statusFase.gatilhoAtivo && statusFase.proximaFaseObj && (
        <div className={`${actionStyles.bossPhaseBanner} ${actionStyles.noPrint}`} onClick={(e) => e.stopPropagation()}>
          <div className={actionStyles.bossPhaseTextWrap}>
            <FaFire className={actionStyles.bossPhaseIcon} />
            <span><strong>GATILHO DE CHEFE ATIVADO:</strong> {statusFase.motivo}</span>
          </div>
          <Button variant="primary" size="sm" onClick={() => onTransicionarFase && onTransicionarFase(p.id, statusFase.proximaFaseObj.numero)}>
            <FaFire /> Transicionar para {statusFase.proximaFaseObj.nome}
          </Button>
        </div>
      )}

      {isMestre && !isEditando && painelAberto === 'vilao' && isInimigo && (
        <VillainCombatDrawer p={p} onFechar={() => setPainelAberto(null)} onAlterarRecurso={onAlterarRecurso} onGastarPontoVilao={onGastarPontoVilao} onTransicionarFase={onTransicionarFase} onAjustarAcaoTurno={onAjustarAcaoTurno} />
      )}
      {isMestre && !isEditando && (painelAberto === 'recursos' || painelAberto === 'condicoes') && (
        <CombatantDrawers p={p} painelAberto={painelAberto} condicoesAtivas={condicoesAtivas} onFechar={() => setPainelAberto(null)} onAlterarRecurso={onAlterarRecurso} onToggleCondicao={onToggleCondicao} />
      )}
    </div>
  );
}
