import React, { useState } from 'react';
import { FaSkull, FaCrown, FaBolt, FaFire, FaMinus, FaPlus, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { Card, Badge, Button } from '../../../../components/ui';
import {
  TIPOS_VILAO, ACOES_PONTOS_VILAO, normalizarTipoVilao, verificarGatilhoTransicaoFase,
  executarTransicaoFaseChefao, consumirPontoVilaoNpc, criarFaseChefaoPadrao, extrairHpMax
} from '../../../../domain/fabula/npcRules';
import styles from './NPCVillainTacticalPanel.module.css';

export default function NPCVillainTacticalPanel({ npc, onUpdate }) {
  const [feedbackTatico, setFeedbackTatico] = useState(null);

  const tipoVilaoKey = normalizarTipoVilao(npc.tipo_vilao || 'padrao');
  const infoVilao = TIPOS_VILAO[tipoVilaoKey] || TIPOS_VILAO.padrao;
  const pontosVilao = Math.max(0, Number(npc.pontos_vilao) || 0);
  const acoesPorTurno = Math.max(1, Number(npc.acoes_por_turno) || 1);
  const fasesChefao = Array.isArray(npc.fases_chefao) ? npc.fases_chefao : [];
  const faseAtualNum = Math.max(1, Number(npc.fase_atual) || 1);

  const maxPv = extrairHpMax(npc);
  const pvAtual = npc.pv_atual !== undefined ? Number(npc.pv_atual) : maxPv;

  const statusFase = verificarGatilhoTransicaoFase({
    hpAtual: pvAtual,
    hpMax: maxPv,
    faseAtual: faseAtualNum,
    fasesChefao
  });

  const handleAjustarPontosVilao = (delta) => {
    onUpdate({ ...npc, pontos_vilao: Math.max(0, pontosVilao + delta) });
  };

  const handleAjustarAcoesTurno = (delta) => {
    onUpdate({ ...npc, acoes_por_turno: Math.max(1, Math.min(8, acoesPorTurno + delta)) });
  };

  const handleGastarPontoVilao = (codigoAcao) => {
    const res = consumirPontoVilaoNpc(npc, { codigoAcao });
    if (!res.valido) {
      setFeedbackTatico({ tipo: 'erro', texto: res.erro });
      return;
    }
    onUpdate(res.entidadeAtualizada);
    setFeedbackTatico({ tipo: 'sucesso', texto: `💀 ${res.resumo}` });
  };

  const handleExecutarTransicaoFase = (numeroAlvo = null) => {
    const res = executarTransicaoFaseChefao(npc, numeroAlvo);
    if (!res.valido) {
      setFeedbackTatico({ tipo: 'erro', texto: res.erro });
      return;
    }
    onUpdate(res.entidadeAtualizada);
    setFeedbackTatico({ tipo: 'fase', texto: `🔥 ${res.resumo}` });
  };

  const handleInicializarFasesRapido = () => {
    const f1 = criarFaseChefaoPadrao(1, { pv_max: maxPv || 100, pm_max: npc.pm_max || 50, acoes_por_turno: acoesPorTurno });
    const f2 = criarFaseChefaoPadrao(2, {
      pv_max: Math.round((maxPv || 100) * 1.25),
      pm_max: npc.pm_max || 50,
      acoes_por_turno: Math.min(6, acoesPorTurno + 1)
    });
    onUpdate({
      ...npc,
      tipo_vilao: tipoVilaoKey === 'padrao' ? 'campeao' : tipoVilaoKey,
      pontos_vilao: pontosVilao === 0 ? 10 : pontosVilao,
      fases_chefao: [f1, f2],
      fase_atual: 1
    });
    setFeedbackTatico({
      tipo: 'sucesso',
      texto: '⚡ Duas fases de chefe configuradas! Quando o PV chegar a 0 na Fase 1, o gatilho da Fase 2 será disparado.'
    });
  };

  const orbesMax = Math.max(pontosVilao, infoVilao.pontosVilaoPadrao || 5, 5);

  return (
    <Card variant="default" className={styles.tacticalPanel}>
      <div className={styles.headerBar}>
        <div className={styles.titleCluster}>
          <div className={styles.titleLine}>
            <h3 className={styles.panelTitle}><FaCrown /> Painel Tático de Vilão & Fases de Chefe</h3>
            <Badge variant={tipoVilaoKey === 'padrao' ? 'default' : 'villain'} size="md">{infoVilao.badgeLabel}</Badge>
            <Badge variant="gold" size="sm">
              <FaBolt /> {acoesPorTurno} {acoesPorTurno === 1 ? 'Ação / Turno' : 'Ações / Turno'}
            </Badge>
            {statusFase.temFases && (
              <Badge variant="crise" size="sm"><FaFire /> Fase {statusFase.faseAtual} / {statusFase.totalFases}</Badge>
            )}
          </div>
          <p className={styles.panelSubtitle}>{infoVilao.descricao}</p>
        </div>

        <div className={`${styles.multiActionControl} ${styles.noPrint}`}>
          <span className={styles.controlMiniLabel}>Multi-Ações:</span>
          <button type="button" className={styles.miniStepBtn} onClick={() => handleAjustarAcoesTurno(-1)} title="Reduzir ações por rodada"><FaMinus /></button>
          <strong className={styles.multiActionVal}>{acoesPorTurno}x</strong>
          <button type="button" className={styles.miniStepBtn} onClick={() => handleAjustarAcoesTurno(1)} title="Aumentar ações por rodada"><FaPlus /></button>
        </div>
      </div>

      {statusFase.gatilhoAtivo && statusFase.proximaFaseObj && (
        <div className={`${styles.phaseTriggerAlert} ${styles.noPrint}`} role="alert">
          <div className={styles.triggerInfo}>
            <FaExclamationTriangle className={styles.triggerIcon} />
            <div>
              <strong className={styles.triggerHeadline}>
                ⚡ GATILHO DE TRANSIÇÃO ATIVADO: {statusFase.proximaFaseObj.nome}
              </strong>
              <p className={styles.triggerSub}>
                {statusFase.motivo} ({statusFase.proximaFaseObj.pv_max} PV • {statusFase.proximaFaseObj.acoes_por_turno} Ações/Turno)
              </p>
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={() => handleExecutarTransicaoFase(statusFase.proximaFaseObj.numero)}>
            <FaFire /> Despertar {statusFase.proximaFaseObj.nome}
          </Button>
        </div>
      )}

      {feedbackTatico && (
        <div className={`${styles.feedbackBanner} ${styles.noPrint}`}>
          <span>{feedbackTatico.texto}</span>
          <button type="button" className={styles.closeFeedbackBtn} onClick={() => setFeedbackTatico(null)}>✕</button>
        </div>
      )}

      <div className={styles.villainPointsSection}>
        <div className={styles.vpTopRow}>
          <div className={styles.vpCounterBox}>
            <span className={styles.vpLabel}><FaSkull /> PONTOS DE VILÃO (ÚLTIMA)</span>
            <div className={styles.vpNumberWrap}>
              <strong className={styles.vpBigNumber}>{pontosVilao}</strong>
              <span className={styles.vpUnit}>PVilão disponíveis</span>
            </div>
            <div className={styles.orbsRow} aria-hidden="true">
              {Array.from({ length: Math.min(15, orbesMax) }).map((_, i) => (
                <span key={i} className={`${styles.villainOrb} ${i < pontosVilao ? styles.villainOrbActive : ''}`} />
              ))}
            </div>
          </div>

          <div className={`${styles.vpManualControls} ${styles.noPrint}`}>
            <button type="button" className={styles.vpAdjustBtn} onClick={() => handleAjustarPontosVilao(-1)}>-1 PVilão</button>
            <button type="button" className={styles.vpAdjustBtn} onClick={() => handleAjustarPontosVilao(1)}>+1 PVilão</button>
            <button type="button" className={styles.vpAdjustBtn} onClick={() => handleAjustarPontosVilao(5)}>+5 PVilão</button>
          </div>
        </div>

        <div className={`${styles.vpAbilitiesGrid} ${styles.noPrint}`}>
          {Object.values(ACOES_PONTOS_VILAO).map((acao) => {
            const semSaldo = pontosVilao < acao.custo;
            return (
              <button
                key={acao.codigo}
                type="button"
                disabled={semSaldo}
                className={`${styles.vpActionCard} ${semSaldo ? styles.vpActionDisabled : ''}`}
                onClick={() => handleGastarPontoVilao(acao.codigo)}
                title={acao.descricao}
              >
                <div className={styles.vpActionTop}>
                  <strong className={styles.vpActionTitle}>{acao.titulo}</strong>
                  <Badge variant="villain" size="sm">-{acao.custo} PVilão</Badge>
                </div>
                <p className={styles.vpActionDesc}>{acao.descricao}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.phasesSection}>
        <div className={styles.phasesHeaderRow}>
          <h4 className={styles.subSectionTitle}><FaFire /> Fases de Vida & Transição de Chefe</h4>
          {!statusFase.temFases && (
            <Button variant="secondary" size="sm" className={styles.noPrint} onClick={handleInicializarFasesRapido}>
              <FaBolt /> Ativar Mecânica de 2 Fases
            </Button>
          )}
        </div>

        {!statusFase.temFases ? (
          <p className={styles.emptyPhasesNote}>
            Este adversário opera em Fase Única. Use o botão acima ou o Editor da Ficha para adicionar múltiplas fases de chefe.
          </p>
        ) : (
          <div className={styles.phasesTimelineGrid}>
            {fasesChefao.map((fase, idx) => {
              const numFase = Number(fase.numero) || idx + 1;
              const isFaseAtiva = numFase === faseAtualNum;
              const isFaseConcluida = numFase < faseAtualNum;

              return (
                <div
                  key={numFase}
                  className={`${styles.phaseCard} ${isFaseAtiva ? styles.phaseCardActive : ''} ${isFaseConcluida ? styles.phaseCardDone : ''}`}
                >
                  <div className={styles.phaseCardHeader}>
                    <div className={styles.phaseNameWrap}>
                      <Badge variant={isFaseAtiva ? 'villain' : isFaseConcluida ? 'default' : 'gold'} size="sm">FASE {numFase}</Badge>
                      <strong className={styles.phaseName}>{fase.nome || `Fase ${numFase}`}</strong>
                    </div>
                    {isFaseAtiva ? (
                      <Badge variant="core" size="sm"><FaCheckCircle /> EM CURSO</Badge>
                    ) : (
                      <button
                        type="button"
                        className={`${styles.activatePhaseBtn} ${styles.noPrint}`}
                        onClick={() => handleExecutarTransicaoFase(numFase)}
                        title={`Transicionar imediatamente para ${fase.nome || `Fase ${numFase}`}`}
                      >
                        <FaFire /> Ativar Fase {numFase}
                      </button>
                    )}
                  </div>

                  <div className={styles.phasePillsRow}>
                    <span className={styles.phaseStatPill}>PV Máx: <strong>{fase.pv_max}</strong></span>
                    <span className={styles.phaseStatPill}>PM Máx: <strong>{fase.pm_max ?? npc.pm_max}</strong></span>
                    <span className={styles.phaseStatPill}>Ações/Turno: <strong>{fase.acoes_por_turno}x</strong></span>
                    {Number(fase.recuperar_pm) > 0 && (
                      <span className={styles.phaseStatPill}>Transição: <strong>+{fase.recuperar_pm} PM</strong></span>
                    )}
                  </div>

                  {fase.efeito_transicao && (
                    <p className={styles.phaseEffectText}><strong>Gatilho/Transição:</strong> {fase.efeito_transicao}</p>
                  )}
                  {fase.habilidades_fase && (
                    <p className={styles.phaseAbilityText}><strong>Padrão da Fase:</strong> {fase.habilidades_fase}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
