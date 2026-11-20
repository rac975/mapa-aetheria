import React, { useState } from 'react';
import {
  FaShieldAlt, FaMagic, FaHeart, FaDragon,
  FaCrosshairs, FaFistRaised, FaCrown, FaBolt, FaFire, FaSkull
} from 'react-icons/fa';
import { Card, Badge, ResourceBar } from '../../../../components/ui';
import {
  clampRecursoNpc,
  extrairHpMax,
  extrairMpMax,
  TIPOS_VILAO,
  normalizarTipoVilao,
  verificarGatilhoTransicaoFase
} from '../../../../domain/fabula/npcRules';
import NPCVillainTacticalPanel from './NPCVillainTacticalPanel';
import NPCArsenalSection from './NPCArsenalSection';
import styles from './NPCView.module.css';

export default function NPCView({ npc, onUpdate }) {
  const [abaAtiva, setAbaAtiva] = useState('completa');

  const bonusDanoNivel = npc.nivel >= 60 ? 15 : npc.nivel >= 40 ? 10 : npc.nivel >= 20 ? 5 : 0;
  const bonusPrecisaoMagia = Math.floor(npc.nivel / 10);

  const maxPv = extrairHpMax(npc);
  const maxPm = extrairMpMax(npc);
  const pvAtual = clampRecursoNpc(npc.pv_atual ?? npc.hp_atual ?? maxPv, maxPv, 0);
  const pmAtual = clampRecursoNpc(npc.pm_atual ?? npc.mp_atual ?? maxPm, maxPm, 0);

  const tipoVilaoKey = normalizarTipoVilao(npc.tipo_vilao || 'padrao');
  const infoVilao = TIPOS_VILAO[tipoVilaoKey] || TIPOS_VILAO.padrao;
  const pontosVilao = Math.max(0, Number(npc.pontos_vilao) || 0);
  const acoesPorTurno = Math.max(1, Number(npc.acoes_por_turno) || 1);
  const statusFase = verificarGatilhoTransicaoFase({
    hpAtual: pvAtual,
    hpMax: maxPv,
    faseAtual: npc.fase_atual || 1,
    fasesChefao: npc.fases_chefao || []
  });

  function atualizarRecurso(campo, novoValorBruto) {
    const isHp = campo === 'pv_atual' || campo === 'hp_atual';
    const isMp = campo === 'pm_atual' || campo === 'mp_atual';
    const teto = isHp ? maxPv : isMp ? maxPm : 9999;
    const novo = clampRecursoNpc(novoValorBruto, teto, 0);
    const updates = {};
    if (isHp) {
      updates.pv_atual = novo;
    } else if (isMp) {
      updates.pm_atual = novo;
    } else {
      updates[campo] = novo;
    }
    onUpdate({ ...npc, ...updates });
  }

  function ajustarStat(campo, delta) {
    const atual = (campo === 'pv_atual' || campo === 'hp_atual') ? pvAtual : pmAtual;
    atualizarRecurso(campo, atual + delta);
  }

  function handleManualChange(campo, valorInput) {
    const num = valorInput === '' ? 0 : parseInt(valorInput, 10);
    atualizarRecurso(campo, isNaN(num) ? 0 : num);
  }

  const rankNorm = npc.rank?.toLowerCase();
  const exibirAtributos = abaAtiva === 'completa' || abaAtiva === 'atributos';
  const exibirVilao = abaAtiva === 'completa' || abaAtiva === 'vilao';

  return (
    <div className={styles.viewContainer}>
      <Card variant="default" className={tipoVilaoKey !== 'padrao' ? styles.bossHeaderBorder : ''}>
        <div className={styles.headerCard}>
          <div className={styles.headerMain}>
            <div className={styles.titleRow}>
              <h1 className={styles.npcTitle}>{npc.nome}</h1>
              {rankNorm === 'elite' ? (
                <Badge variant="ether" size="md">ELITE</Badge>
              ) : rankNorm === 'campeao' ? (
                <Badge variant="crise" size="md">
                  CAMPEÃO {npc.quantidade_soldados ? `(${npc.quantidade_soldados}x)` : ''}
                </Badge>
              ) : (
                <Badge variant="gold" size="md">SOLDADO</Badge>
              )}
              {tipoVilaoKey !== 'padrao' && (
                <Badge variant="villain" size="md"><FaCrown /> {infoVilao.badgeLabel}</Badge>
              )}
            </div>
            <div className={styles.metaRow}>
              <Badge variant="default" size="sm"><FaDragon /> {npc.especie?.toUpperCase() || 'FERA'}</Badge>
              <Badge variant="ether" size="sm">Nível {npc.nivel}</Badge>
              {Boolean(npc.voador) && (
                <Badge variant="ether" size="sm" title="Criatura Voadora">🦅 Voador</Badge>
              )}
              <Badge variant="gold" size="sm">
                <FaBolt /> {acoesPorTurno} {acoesPorTurno === 1 ? 'Ação/Turno' : 'Ações/Turno'}
              </Badge>
              {pontosVilao > 0 && (
                <Badge variant="villain" size="sm"><FaSkull /> {pontosVilao} PVilão</Badge>
              )}
              {statusFase.temFases && (
                <Badge variant="crise" size="sm">
                  <FaFire /> Fase {statusFase.faseAtual}/{statusFase.totalFases}
                </Badge>
              )}
            </div>
          </div>

          <div className={styles.bonusBox}>
            <div className={styles.bonusItem}>
              <span><FaCrosshairs /> Bônus Testes:</span>
              <span className={styles.bonusValue}>+{bonusPrecisaoMagia}</span>
            </div>
            <div className={styles.bonusItem}>
              <span><FaFistRaised /> Bônus Dano:</span>
              <span className={styles.bonusValue}>+{bonusDanoNivel}</span>
            </div>
          </div>
        </div>
      </Card>

      <div className={`${styles.tacticalTabsBar} ${styles.noPrint}`} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={abaAtiva === 'completa'}
          className={`${styles.tacticalTabBtn} ${abaAtiva === 'completa' ? styles.tacticalTabActive : ''}`}
          onClick={() => setAbaAtiva('completa')}
        >
          <FaDragon />
          <span className={styles.tabLabelFull}>Visão Completa</span>
          <span className={styles.tabLabelShort}>Completa</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={abaAtiva === 'vilao'}
          className={`${styles.tacticalTabBtn} ${styles.tacticalTabVillain} ${abaAtiva === 'vilao' ? styles.tacticalTabVillainActive : ''}`}
          onClick={() => setAbaAtiva('vilao')}
        >
          <FaCrown />
          <span className={styles.tabLabelFull}>Aba Tática de Vilão</span>
          <span className={styles.tabLabelShort}>Tática Vilão</span>
          {statusFase.gatilhoAtivo && <Badge variant="crise" size="sm" className={styles.tabBadge}>⚡ FASE</Badge>}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={abaAtiva === 'atributos'}
          className={`${styles.tacticalTabBtn} ${abaAtiva === 'atributos' ? styles.tacticalTabActive : ''}`}
          onClick={() => setAbaAtiva('atributos')}
        >
          <FaShieldAlt />
          <span className={styles.tabLabelFull}>Atributos & Arsenal</span>
          <span className={styles.tabLabelShort}>Arsenal</span>
        </button>
      </div>

      <Card variant="default">
        <h3 className={styles.sectionTitle}><FaHeart /> Estatísticas de Combate</h3>
        <div className={styles.combatGrid}>
          <div className={styles.resourceCard}>
            <ResourceBar type="pv" current={pvAtual} max={maxPv} label="PONTOS DE VIDA" />
            <div className={`${styles.statControls} ${styles.noPrint}`}>
              <button type="button" onClick={() => ajustarStat('pv_atual', -10)} className={styles.statQuickBtn}>-10</button>
              <button type="button" onClick={() => ajustarStat('pv_atual', -5)} className={styles.statQuickBtn}>-5</button>
              <button type="button" onClick={() => ajustarStat('pv_atual', -1)} className={styles.statQuickBtn}>-1</button>
              <input
                type="number"
                min={0}
                max={maxPv}
                value={pvAtual}
                onChange={(e) => handleManualChange('pv_atual', e.target.value)}
                className={styles.statManualInput}
                aria-label="Ajuste manual de PV atual"
              />
              <button type="button" onClick={() => ajustarStat('pv_atual', 1)} className={styles.statQuickBtn}>+1</button>
              <button type="button" onClick={() => ajustarStat('pv_atual', 5)} className={styles.statQuickBtn}>+5</button>
            </div>
          </div>

          <div className={styles.resourceCard}>
            <ResourceBar type="pm" current={pmAtual} max={maxPm} label="PONTOS DE MANA" />
            <div className={`${styles.statControls} ${styles.noPrint}`}>
              <button type="button" onClick={() => ajustarStat('pm_atual', -10)} className={styles.statQuickBtn}>-10</button>
              <button type="button" onClick={() => ajustarStat('pm_atual', -5)} className={styles.statQuickBtn}>-5</button>
              <button type="button" onClick={() => ajustarStat('pm_atual', -1)} className={styles.statQuickBtn}>-1</button>
              <input
                type="number"
                min={0}
                max={maxPm}
                value={pmAtual}
                onChange={(e) => handleManualChange('pm_atual', e.target.value)}
                className={styles.statManualInput}
                aria-label="Ajuste manual de PM atual"
              />
              <button type="button" onClick={() => ajustarStat('pm_atual', 1)} className={styles.statQuickBtn}>+1</button>
              <button type="button" onClick={() => ajustarStat('pm_atual', 5)} className={styles.statQuickBtn}>+5</button>
            </div>
          </div>

          <div className={styles.statCardCenter}>
            <span className={styles.statTitle}><FaShieldAlt /> Defesa</span>
            <p className={styles.statNumberLarge}>{npc.defesa}</p>
          </div>
          <div className={styles.statCardCenter}>
            <span className={styles.statTitle}><FaMagic /> Def. Mág.</span>
            <p className={styles.statNumberLarge}>{npc.defesa_magica}</p>
          </div>
          <div className={styles.statCardCenter}>
            <span className={styles.statTitle}>Iniciativa</span>
            <p className={styles.statNumberLarge}>{npc.iniciativa ?? 0}</p>
          </div>
        </div>
      </Card>

      {exibirVilao && <NPCVillainTacticalPanel npc={npc} onUpdate={onUpdate} />}
      {exibirAtributos && <NPCArsenalSection npc={npc} />}
    </div>
  );
}
