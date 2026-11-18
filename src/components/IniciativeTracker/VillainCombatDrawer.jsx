import React from 'react';
import {
  FaCrown,
  FaSkull,
  FaBolt,
  FaFire,
  FaTimes,
  FaMinus,
  FaPlus,
  FaCheckCircle,
  FaExclamationTriangle
} from 'react-icons/fa';
import { Badge, Button } from '../ui';
import {
  TIPOS_VILAO,
  ACOES_PONTOS_VILAO,
  normalizarTipoVilao,
  verificarGatilhoTransicaoFase,
  extrairHpMax
} from '../../domain/fabula/combatRules';
import styles from './VillainCombatDrawer.module.css';

export default function VillainCombatDrawer({
  p,
  onFechar,
  onAlterarRecurso,
  onGastarPontoVilao,
  onTransicionarFase,
  onAjustarAcaoTurno
}) {
  const tipoVilaoKey = normalizarTipoVilao(p.tipo_vilao || 'padrao');
  const infoVilao = TIPOS_VILAO[tipoVilaoKey] || TIPOS_VILAO.padrao;
  const pontosVilao = Math.max(0, Number(p.pontos_vilao ?? p.pontos_ultima) || 0);
  const acoesPorTurno = Math.max(1, Number(p.acoes_por_turno) || 1);
  const acoesRealizadas = Math.max(0, Number(p.modificadores?.acoes_realizadas_rodada) || 0);
  const fasesChefao = Array.isArray(p.fases_chefao) ? p.fases_chefao : [];
  const faseAtualNum = Math.max(1, Number(p.fase_atual) || 1);

  const statusFase = verificarGatilhoTransicaoFase({
    hpAtual: p.hp_atual,
    hpMax: extrairHpMax(p),
    faseAtual: faseAtualNum,
    fasesChefao
  });

  return (
    <div className={`${styles.villainDrawer} ${styles.noPrint}`} onClick={(e) => e.stopPropagation()}>
      <div className={styles.drawerHeader}>
        <div className={styles.headerTitleCluster}>
          <FaCrown className={styles.crownIcon} />
          <span className={styles.drawerTitle}>Comando Tático de Vilão — {p.nome}</span>
          <Badge variant="villain" size="sm">{infoVilao.badgeLabel}</Badge>
          {statusFase.temFases && (
            <Badge variant="crise" size="sm">
              <FaFire /> Fase {statusFase.faseAtual}/{statusFase.totalFases}
            </Badge>
          )}
        </div>
        <button type="button" className={styles.closeBtn} onClick={onFechar} aria-label="Fechar painel de vilão">
          <FaTimes />
        </button>
      </div>

      {/* Gatilho de Transição de Fase */}
      {statusFase.gatilhoAtivo && statusFase.proximaFaseObj && (
        <div className={styles.triggerAlertBox}>
          <div className={styles.triggerLeft}>
            <FaExclamationTriangle className={styles.triggerAlertIcon} />
            <div>
              <strong className={styles.triggerTitle}>
                ⚡ GATILHO DE FASE ATIVADO: {statusFase.proximaFaseObj.nome}
              </strong>
              <span className={styles.triggerSub}>{statusFase.motivo}</span>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onTransicionarFase && onTransicionarFase(p.id, statusFase.proximaFaseObj.numero)}
          >
            <FaFire /> Despertar {statusFase.proximaFaseObj.nome}
          </Button>
        </div>
      )}

      {/* Linha Principal: Pontos de Vilão + Multi-Ações da Rodada */}
      <div className={styles.topControlsGrid}>
        {/* Controle de Pontos de Vilão */}
        <div className={styles.controlBlock}>
          <div className={styles.blockHeader}>
            <span className={styles.blockLabel}>
              <FaSkull /> PONTOS DE VILÃO: <strong className={styles.highlightValue}>{pontosVilao}</strong>
            </span>
            <div className={styles.deltaBtnGroup}>
              <button
                type="button"
                className={styles.stepBtn}
                onClick={() => onAlterarRecurso(p.id, 'pontos_vilao', pontosVilao, -1)}
                title="Reduzir 1 Ponto de Vilão"
              >
                <FaMinus />
              </button>
              <button
                type="button"
                className={styles.stepBtn}
                onClick={() => onAlterarRecurso(p.id, 'pontos_vilao', pontosVilao, 1)}
                title="Adicionar 1 Ponto de Vilão"
              >
                <FaPlus />
              </button>
              <button
                type="button"
                className={styles.stepBtn}
                onClick={() => onAlterarRecurso(p.id, 'pontos_vilao', pontosVilao, 5)}
                title="Adicionar 5 Pontos de Vilão"
              >
                +5
              </button>
            </div>
          </div>
          <div className={styles.orbsStrip}>
            {Array.from({ length: Math.min(15, Math.max(pontosVilao, 5)) }).map((_, idx) => (
              <span
                key={idx}
                className={`${styles.orb} ${idx < pontosVilao ? styles.orbActive : ''}`}
              />
            ))}
          </div>
        </div>

        {/* Controle de Multi-Ações por Turno */}
        <div className={styles.controlBlock}>
          <div className={styles.blockHeader}>
            <span className={styles.blockLabel}>
              <FaBolt /> MULTI-AÇÕES NA RODADA:{' '}
              <strong className={styles.highlightValue}>{acoesRealizadas} / {acoesPorTurno}</strong>
            </span>
            <div className={styles.deltaBtnGroup}>
              <button
                type="button"
                className={styles.stepBtn}
                onClick={() => onAjustarAcaoTurno && onAjustarAcaoTurno(p.id, -1)}
                title="Desfazer 1 ação realizada nesta rodada"
              >
                -1 Ação
              </button>
              <button
                type="button"
                className={styles.stepBtnPrimary}
                onClick={() => onAjustarAcaoTurno && onAjustarAcaoTurno(p.id, 1)}
                title="Consumir 1 ação nesta rodada"
              >
                +1 Ação
              </button>
            </div>
          </div>
          <div className={styles.totalAcoesRow}>
            <span className={styles.subHint}>Total de Ações/Rodada:</span>
            <div className={styles.deltaBtnGroup}>
              {[1, 2, 3, 4].map((qtd) => (
                <button
                  key={qtd}
                  type="button"
                  className={`${styles.stepBtn} ${acoesPorTurno === qtd ? styles.stepBtnSelected : ''}`}
                  onClick={() => onAjustarAcaoTurno && onAjustarAcaoTurno(p.id, 0, qtd)}
                >
                  {qtd}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Gasto Rápido de Pontos de Vilão (Reações e Habilidades) */}
      <div className={styles.abilitiesSection}>
        <span className={styles.subSectionLabel}>Gastar Pontos de Vilão (Sincronizado no Feed):</span>
        <div className={styles.abilitiesGrid}>
          {Object.values(ACOES_PONTOS_VILAO).map((acao) => {
            const semSaldo = pontosVilao < acao.custo;
            return (
              <button
                key={acao.codigo}
                type="button"
                disabled={semSaldo}
                className={`${styles.abilityBtn} ${semSaldo ? styles.abilityBtnDisabled : ''}`}
                onClick={() => onGastarPontoVilao && onGastarPontoVilao(p.id, acao.codigo)}
                title={acao.descricao}
              >
                <div className={styles.abilityTop}>
                  <strong>{acao.titulo}</strong>
                  <Badge variant="villain" size="sm">-{acao.custo} PVilão</Badge>
                </div>
                <span className={styles.abilityDesc}>{acao.descricao}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fases do Chefão */}
      {statusFase.temFases && (
        <div className={styles.phasesSection}>
          <span className={styles.subSectionLabel}>
            <FaFire /> Fases de Combate do Chefão ({statusFase.totalFases}):
          </span>
          <div className={styles.phasesRow}>
            {fasesChefao.map((fase, idx) => {
              const numFase = Number(fase.numero) || idx + 1;
              const isAtiva = numFase === faseAtualNum;
              return (
                <div
                  key={numFase}
                  className={`${styles.phaseChipCard} ${isAtiva ? styles.phaseChipActive : ''}`}
                >
                  <div className={styles.phaseChipTop}>
                    <div className={styles.phaseChipTitleWrap}>
                      <Badge variant={isAtiva ? 'villain' : 'default'} size="sm">F{numFase}</Badge>
                      <strong className={styles.phaseChipName}>{fase.nome || `Fase ${numFase}`}</strong>
                    </div>
                    {isAtiva ? (
                      <Badge variant="core" size="sm"><FaCheckCircle /> Ativa</Badge>
                    ) : (
                      <button
                        type="button"
                        className={styles.phaseSwitchBtn}
                        onClick={() => onTransicionarFase && onTransicionarFase(p.id, numFase)}
                      >
                        <FaFire /> Ativar
                      </button>
                    )}
                  </div>
                  <div className={styles.phaseMetaText}>
                    PV: {fase.pv_max} • PM: {fase.pm_max ?? p.mp_max} • {fase.acoes_por_turno}x Ações
                  </div>
                  {fase.efeito_transicao && (
                    <p className={styles.phaseTransicaoNote}>{fase.efeito_transicao}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
