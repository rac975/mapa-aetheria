import { useState, useMemo } from 'react';
import { FaBolt, FaDice, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { Button, Badge } from '../ui';
import { CUSTO_PM_ALTA_VELOCIDADE, detectarHabilidadePreConflito } from '../../domain/fabula/combatPreConflictRules';
import styles from './PreConflictActionsBar.module.css';

const OPCOES_ACAO_PRE = [
  { codigo: 'ATAQUE_LIVRE', rotulo: '⚔️ Ataque Livre (+NP Precisão)' },
  { codigo: 'IMPEDIMENTO', rotulo: '🌀 Impedimento (+NP vs ND 10)' },
  { codigo: 'OBJETIVO', rotulo: '🕒 Objetivo (+NP vs ND 10)' }
];

const CONDICOES_IMPEDIMENTO = [
  { id: 'lento', rotulo: 'Lento (DES ↓)' },
  { id: 'confuso', rotulo: 'Confuso (AST ↓)' },
  { id: 'fraco', rotulo: 'Fraco (VIG ↓)' },
  { id: 'abalado', rotulo: 'Abalado (VON ↓)' },
  { id: 'enfurecido', rotulo: 'Enfurecido (DES/AST ↓)' },
  { id: 'envenenado', rotulo: 'Envenenado (VIG/VON ↓)' }
];

export default function PreConflictActionsBar({
  isMestre,
  rodada = 1,
  participantes = [],
  relogios = [],
  meuHeroi = null,
  obterPerfilRolagem,
  onExecutarAcaoPreRodada
}) {
  const [aberto, setAberto] = useState(false);

  const heroisHabilitados = useMemo(() => {
    return (participantes || []).filter((p) => {
      if (p.tipo !== 'heroi' || Number(p.hp_atual) <= 0) return false;
      const perfil = obterPerfilRolagem ? obterPerfilRolagem(p) : null;
      const hab = detectarHabilidadePreConflito(perfil?.ficha);
      return Boolean((hab?.possuiAltaVelocidade && hab.np > 0) || (hab?.possuiAnaliseRapida && hab.npAnaliseRapida > 0));
    });
  }, [participantes, obterPerfilRolagem]);

  const alvosDisponiveis = useMemo(
    () => (participantes || []).filter((p) => Number(p.hp_atual) > 0),
    [participantes]
  );

  const [heroiId, setHeroiId] = useState('');
  const [tipoAcaoPre, setTipoAcaoPre] = useState('ATAQUE_LIVRE');
  const [pmAnaliseGasto, setPmAnaliseGasto] = useState(5);
  const [tipoRevelacao, setTipoRevelacao] = useState('traco');
  const [npOverride, setNpOverride] = useState(null);
  const [alvoId, setAlvoId] = useState('');
  const [condicaoId, setCondicaoId] = useState('lento');
  const [relogioId, setRelogioId] = useState('');

  const heroiSelecionado = (!isMestre && meuHeroi)
    ? (heroisHabilitados.some((h) => String(h.id) === String(meuHeroi.id)) ? meuHeroi : null)
    : (heroisHabilitados.find((h) => String(h.id) === String(heroiId)) || heroisHabilitados[0] || null);

  const perfilHeroi = heroiSelecionado && obterPerfilRolagem ? obterPerfilRolagem(heroiSelecionado) : null;
  const infoHab = useMemo(
    () => detectarHabilidadePreConflito(perfilHeroi?.ficha),
    [perfilHeroi?.ficha]
  );

  const opcoesAcao = useMemo(() => {
    const lista = [];
    if (infoHab?.possuiAltaVelocidade) lista.push(...OPCOES_ACAO_PRE);
    if (infoHab?.possuiAnaliseRapida) {
      lista.push({
        codigo: 'ANALISE_RAPIDA',
        rotulo: `🔍 Análise Rápida (5 a ${infoHab.custoMaximoAnaliseRapida} PM)`
      });
    }
    return lista.length > 0 ? lista : OPCOES_ACAO_PRE;
  }, [infoHab]);

  const acaoEfetiva = opcoesAcao.some((o) => o.codigo === tipoAcaoPre)
    ? tipoAcaoPre
    : (opcoesAcao[0]?.codigo || 'ATAQUE_LIVRE');

  const np = npOverride !== null ? npOverride : (infoHab?.possuiAltaVelocidade ? infoHab.np : 1);

  if (heroisHabilitados.length === 0 || (!isMestre && !heroiSelecionado)) return null;

  const handleExecutar = async () => {
    if (!heroiSelecionado) return;
    await onExecutarAcaoPreRodada?.({
      heroiId: heroiSelecionado.id,
      tipoAcaoPre: acaoEfetiva,
      np,
      alvoId: alvoId || null,
      relogioId: relogioId || null,
      condicaoId,
      pmGasto: pmAnaliseGasto,
      tipoRevelacao
    });
  };

  return (
    <div className={styles.preBarContainer}>
      <button
        type="button"
        className={styles.toggleHeaderBtn}
        onClick={() => setAberto((v) => !v)}
        title="Habilidades de Início de Conflito / Pré-1ª Rodada"
      >
        <div className={styles.titleRow}>
          <FaBolt className={styles.boltIcon} />
          <span className={styles.barTitle}>
            Ações de Início de Conflito (Pré-1ª Rodada)
          </span>
          {rodada === 1 && <Badge variant="gold" size="sm">1ª Rodada</Badge>}
          {infoHab.possuiAltaVelocidade && (
            <Badge variant="core" size="sm">{infoHab.nomeHabilidade} (NP {infoHab.np})</Badge>
          )}
          {infoHab.possuiAnaliseRapida && (
            <Badge variant="ether" size="sm">Análise Rápida (NP {infoHab.npAnaliseRapida})</Badge>
          )}
        </div>
        <span className={styles.chevron}>
          {aberto ? <FaChevronUp /> : <FaChevronDown />}
        </span>
      </button>

      {aberto && (
        <div className={styles.panelBody}>
          <div className={styles.controlsGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Herói:</label>
              <select
                className={styles.selectInput}
                value={heroiSelecionado?.id || ''}
                disabled={!isMestre && Boolean(meuHeroi)}
                onChange={(e) => { setHeroiId(e.target.value); setNpOverride(null); }}
              >
                {heroisHabilitados.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.nome} ({h.mp_atual}/{h.mp_max} PM)
                  </option>
                ))}
              </select>
            </div>

            {acaoEfetiva !== 'ANALISE_RAPIDA' && (
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Bônus de Perícia (NP):</label>
                <select
                  className={styles.selectInput}
                  value={np}
                  onChange={(e) => setNpOverride(Number(e.target.value))}
                >
                  <option value={1}>NP 1 (+1 nos testes)</option>
                  <option value={2}>NP 2 (+2 nos testes)</option>
                  <option value={3}>NP 3 (+3 nos testes)</option>
                </select>
              </div>
            )}

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Ação de Início de Conflito:</label>
              <select
                className={styles.selectInput}
                value={acaoEfetiva}
                onChange={(e) => setTipoAcaoPre(e.target.value)}
              >
                {opcoesAcao.map((op) => (
                  <option key={op.codigo} value={op.codigo}>{op.rotulo}</option>
                ))}
              </select>
            </div>

            {acaoEfetiva === 'ANALISE_RAPIDA' && (
              <>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Gasto em PM:</label>
                  <select className={styles.selectInput} value={pmAnaliseGasto} onChange={(e) => setPmAnaliseGasto(Number(e.target.value))}>
                    {Array.from({ length: Math.max(1, infoHab.npAnaliseRapida || 1) }, (_, i) => (i + 1) * 5).map((c) => (
                      <option key={c} value={c}>{c} PM ({c / 5} revelação)</option>
                    ))}
                  </select>
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Revelar:</label>
                  <select className={styles.selectInput} value={tipoRevelacao} onChange={(e) => setTipoRevelacao(e.target.value)}>
                    <option value="traco">Traço da Criatura</option>
                    <option value="afinidade">Afinidade Elemental</option>
                  </select>
                </div>
              </>
            )}

            {(acaoEfetiva === 'ATAQUE_LIVRE' || acaoEfetiva === 'IMPEDIMENTO' || acaoEfetiva === 'ANALISE_RAPIDA') && (
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Alvo:</label>
                <select className={styles.selectInput} value={alvoId} onChange={(e) => setAlvoId(e.target.value)}>
                  <option value="">-- Selecionar Alvo --</option>
                  {alvosDisponiveis.map((a) => (
                    <option key={a.id} value={a.id}>{a.nome} ({a.tipo === 'heroi' ? 'Herói' : 'Inimigo'})</option>
                  ))}
                </select>
              </div>
            )}

            {acaoEfetiva === 'IMPEDIMENTO' && (
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Condição (Impedimento):</label>
                <select className={styles.selectInput} value={condicaoId} onChange={(e) => setCondicaoId(e.target.value)}>
                  {CONDICOES_IMPEDIMENTO.map((c) => (
                    <option key={c.id} value={c.id}>{c.rotulo}</option>
                  ))}
                </select>
              </div>
            )}

            {acaoEfetiva === 'OBJETIVO' && relogios.length > 0 && (
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Relógio de Objetivo:</label>
                <select className={styles.selectInput} value={relogioId} onChange={(e) => setRelogioId(e.target.value)}>
                  <option value="">-- Nenhum Relógio --</option>
                  {relogios.map((r) => (
                    <option key={r.id} value={r.id}>{r.nome} ({r.fatias_atuais}/{r.fatias_total})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className={styles.actionFooter}>
            <span className={styles.ruleHint}>
              {acaoEfetiva === 'ANALISE_RAPIDA'
                ? `Gasta ${pmAnaliseGasto} PM antes da 1ª rodada para revelar ${tipoRevelacao === 'afinidade' ? 'Afinidade' : 'Traço'} sem consumir turno.`
                : `Gasta ${CUSTO_PM_ALTA_VELOCIDADE} PM antes da 1ª rodada (+${np} NP no teste).`}
            </span>
            <Button variant="gold" size="sm" onClick={handleExecutar}>
              <FaDice /> Executar ({acaoEfetiva === 'ANALISE_RAPIDA' ? `-${pmAnaliseGasto} PM` : `-${CUSTO_PM_ALTA_VELOCIDADE} PM, +${np} NP`})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
