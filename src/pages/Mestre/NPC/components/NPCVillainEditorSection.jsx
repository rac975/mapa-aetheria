import React from 'react';
import { FaSkull, FaCrown, FaBolt, FaPlus, FaTrash, FaFire } from 'react-icons/fa';
import { Card, Button, Badge } from '../../../../components/ui';
import {
  TIPOS_VILAO,
  normalizarTipoVilao,
  calcularPontosVilaoPadrao,
  calcularAcoesPorTurnoNpc,
  criarFaseChefaoPadrao
} from '../../../../domain/fabula/npcRules';
import styles from './NPCVillainEditorSection.module.css';

export default function NPCVillainEditorSection({ npc, onUpdate, isCompanheiro = false }) {
  if (isCompanheiro) return null;

  const tipoVilaoAtual = normalizarTipoVilao(npc.tipo_vilao || 'padrao');
  const infoVilao = TIPOS_VILAO[tipoVilaoAtual] || TIPOS_VILAO.padrao;
  const pontosVilao = Math.max(0, Number(npc.pontos_vilao) || 0);
  const acoesPorTurno = Math.max(1, Number(npc.acoes_por_turno) || 1);
  const fasesChefao = Array.isArray(npc.fases_chefao) ? npc.fases_chefao : [];

  const handleMudarTipoVilao = (novoTipo) => {
    const tipoNorm = normalizarTipoVilao(novoTipo);
    const pvSugerido = calcularPontosVilaoPadrao(tipoNorm);
    const acoesSugeridas = calcularAcoesPorTurnoNpc({
      rank: npc.rank,
      tipoVilao: tipoNorm,
      quantidadeSoldados: npc.quantidade_soldados
    });
    onUpdate({
      ...npc,
      tipo_vilao: tipoNorm,
      pontos_vilao: pvSugerido,
      acoes_por_turno: acoesSugeridas
    });
  };

  const handleAdicionarFase = () => {
    const proximoNumero = fasesChefao.length + 1;
    const novaFase = criarFaseChefaoPadrao(proximoNumero, {
      pv_max: proximoNumero === 1 ? npc.pv_max : Math.round((Number(npc.pv_max) || 100) * 1.25),
      pm_max: npc.pm_max,
      acoes_por_turno: proximoNumero === 1 ? acoesPorTurno : Math.min(6, acoesPorTurno + 1)
    });
    onUpdate({ ...npc, fases_chefao: [...fasesChefao, novaFase], fase_atual: npc.fase_atual || 1 });
  };

  const handleGerarDuasFasesPadrao = () => {
    const f1 = criarFaseChefaoPadrao(1, { pv_max: npc.pv_max || 100, pm_max: npc.pm_max || 50, acoes_por_turno: acoesPorTurno });
    const f2 = criarFaseChefaoPadrao(2, {
      pv_max: Math.round((Number(npc.pv_max) || 100) * 1.25),
      pm_max: npc.pm_max || 50,
      acoes_por_turno: Math.min(6, acoesPorTurno + 1)
    });
    onUpdate({ ...npc, fases_chefao: [f1, f2], fase_atual: 1 });
  };

  const handleAtualizarFase = (index, campo, valor) => {
    const novasFases = fasesChefao.map((f, idx) => (idx === index ? { ...f, [campo]: valor } : f));
    onUpdate({ ...npc, fases_chefao: novasFases });
  };

  const handleRemoverFase = (index) => {
    const filtradas = fasesChefao.filter((_, idx) => idx !== index).map((f, idx) => ({ ...f, numero: idx + 1 }));
    onUpdate({
      ...npc,
      fases_chefao: filtradas,
      fase_atual: Math.min(Number(npc.fase_atual) || 1, Math.max(1, filtradas.length))
    });
  };

  return (
    <Card variant="default" className={styles.villainCard}>
      <div className={styles.headerRow}>
        <div>
          <h3 className={styles.sectionTitle}><FaCrown /> Mecânicas de Vilão & Fases de Chefe</h3>
          <p className={styles.subtitle}>{infoVilao.descricao}</p>
        </div>
        <Badge variant={tipoVilaoAtual === 'padrao' ? 'default' : 'villain'} size="md">
          {infoVilao.badgeLabel}
        </Badge>
      </div>

      <div className={styles.configGrid}>
        <div className={styles.fieldWrapper}>
          <label className={styles.label}>Escala de Vilão (tipo_vilao)</label>
          <select className={styles.select} value={tipoVilaoAtual} onChange={(e) => handleMudarTipoVilao(e.target.value)}>
            {Object.values(TIPOS_VILAO).map((tv) => (
              <option key={tv.id} value={tv.id}>{tv.label} ({tv.pontosVilaoPadrao} PVilão)</option>
            ))}
          </select>
        </div>

        <div className={styles.fieldWrapper}>
          <label className={styles.label}><FaSkull /> Pontos de Vilão (pontos_vilao)</label>
          <div className={styles.inlineInputGroup}>
            <input
              type="number"
              min={0}
              max={30}
              className={styles.input}
              value={pontosVilao}
              onChange={(e) => onUpdate({ ...npc, pontos_vilao: Math.max(0, parseInt(e.target.value, 10) || 0) })}
            />
            <div className={styles.presetPills}>
              {[0, 5, 10, 15].map((val) => (
                <button
                  key={val}
                  type="button"
                  className={`${styles.presetBtn} ${pontosVilao === val ? styles.presetBtnActive : ''}`}
                  onClick={() => onUpdate({ ...npc, pontos_vilao: val })}
                  title={`Definir ${val} Pontos de Vilão`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.fieldWrapper}>
          <label className={styles.label}><FaBolt /> Multi-Ações / Rodada (acoes_por_turno)</label>
          <input
            type="number"
            min={1}
            max={8}
            className={styles.input}
            value={acoesPorTurno}
            onChange={(e) => onUpdate({ ...npc, acoes_por_turno: Math.max(1, parseInt(e.target.value, 10) || 1) })}
          />
        </div>
      </div>

      <div className={styles.phasesBlock}>
        <div className={styles.phasesHeader}>
          <div>
            <h4 className={styles.phasesTitle}><FaFire /> Fases de Combate do Chefão ({fasesChefao.length})</h4>
            <span className={styles.phasesHint}>
              Configure transições automáticas quando o HP da Fase 1 chegar a 0 ou entrar em Crise.
            </span>
          </div>
          <div className={styles.phasesActions}>
            {fasesChefao.length === 0 && (
              <Button variant="secondary" size="sm" onClick={handleGerarDuasFasesPadrao}>
                <FaBolt /> Gerar 2 Fases (Padrão Chefe)
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={handleAdicionarFase}>
              <FaPlus /> Nova Fase
            </Button>
          </div>
        </div>

        {fasesChefao.length === 0 ? (
          <p className={styles.emptyPhases}>
            Nenhuma fase múltipla configurada (o adversário usará uma única barra de PV padrão).
          </p>
        ) : (
          <div className={styles.phasesList}>
            {fasesChefao.map((fase, idx) => (
              <div key={idx} className={styles.phaseItemCard}>
                <div className={styles.phaseItemTop}>
                  <Badge variant="villain" size="sm">FASE {fase.numero || idx + 1}</Badge>
                  <input
                    type="text"
                    className={styles.input}
                    value={fase.nome || ''}
                    onChange={(e) => handleAtualizarFase(idx, 'nome', e.target.value)}
                    placeholder={`Nome da Fase ${idx + 1}`}
                  />
                  <Button variant="danger" size="sm" onClick={() => handleRemoverFase(idx)} title="Remover esta fase">
                    <FaTrash />
                  </Button>
                </div>

                <div className={styles.phaseStatsRow}>
                  <div className={styles.fieldWrapper}>
                    <label className={styles.label}>PV Máx da Fase</label>
                    <input type="number" min={1} className={styles.input} value={fase.pv_max ?? 100} onChange={(e) => handleAtualizarFase(idx, 'pv_max', Math.max(1, parseInt(e.target.value, 10) || 1))} />
                  </div>
                  <div className={styles.fieldWrapper}>
                    <label className={styles.label}>PM Máx da Fase</label>
                    <input type="number" min={0} className={styles.input} value={fase.pm_max ?? npc.pm_max ?? 50} onChange={(e) => handleAtualizarFase(idx, 'pm_max', Math.max(0, parseInt(e.target.value, 10) || 0))} />
                  </div>
                  <div className={styles.fieldWrapper}>
                    <label className={styles.label}>Ações / Turno</label>
                    <input type="number" min={1} max={8} className={styles.input} value={fase.acoes_por_turno ?? acoesPorTurno} onChange={(e) => handleAtualizarFase(idx, 'acoes_por_turno', Math.max(1, parseInt(e.target.value, 10) || 1))} />
                  </div>
                  <div className={styles.fieldWrapper}>
                    <label className={styles.label}>Gatilho de Entrada</label>
                    <select className={styles.select} value={fase.gatilho || (idx === 0 ? 'inicio' : 'hp_zero')} onChange={(e) => handleAtualizarFase(idx, 'gatilho', e.target.value)}>
                      <option value="inicio">Início do Conflito</option>
                      <option value="hp_zero">Ao chegar a 0 PV na fase anterior</option>
                      <option value="crise">Ao entrar em Crise na fase anterior</option>
                      <option value="manual">Gatilho Narrativo / Manual</option>
                    </select>
                  </div>
                  <div className={styles.fieldWrapper}>
                    <label className={styles.label}>Recuperar PM</label>
                    <input type="number" min={0} className={styles.input} value={fase.recuperar_pm ?? 0} onChange={(e) => handleAtualizarFase(idx, 'recuperar_pm', Math.max(0, parseInt(e.target.value, 10) || 0))} />
                  </div>
                </div>

                <div className={styles.phaseDetailsRow}>
                  <div className={styles.fieldWrapper}>
                    <label className={styles.label}>Efeito de Transição / Mecânica Disparo</label>
                    <input type="text" className={styles.input} value={fase.efeito_transicao || ''} onChange={(e) => handleAtualizarFase(idx, 'efeito_transicao', e.target.value)} placeholder="Ex: Explosão Astral — limpa condições negativas e altera afinidades..." />
                  </div>
                  <div className={styles.fieldWrapper}>
                    <label className={styles.label}>Habilidades / Padrão de Ataque da Fase</label>
                    <input type="text" className={styles.input} value={fase.habilidades_fase || ''} onChange={(e) => handleAtualizarFase(idx, 'habilidades_fase', e.target.value)} placeholder="Ex: Desbloqueia Julgamento Carmesim e recebe +5 de Dano..." />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
