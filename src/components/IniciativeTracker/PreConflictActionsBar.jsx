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

  const herois = useMemo(
    () => (participantes || []).filter((p) => p.tipo === 'heroi' && Number(p.hp_atual) > 0),
    [participantes]
  );

  const alvosDisponiveis = useMemo(
    () => (participantes || []).filter((p) => Number(p.hp_atual) > 0),
    [participantes]
  );

  const [heroiId, setHeroiId] = useState('');
  const [tipoAcaoPre, setTipoAcaoPre] = useState('ATAQUE_LIVRE');
  const [npOverride, setNpOverride] = useState(null);
  const [alvoId, setAlvoId] = useState('');
  const [condicaoId, setCondicaoId] = useState('lento');
  const [relogioId, setRelogioId] = useState('');

  const heroiSelecionado = (!isMestre && meuHeroi)
    ? meuHeroi
    : (herois.find((h) => String(h.id) === String(heroiId)) || herois[0] || null);
  const perfilHeroi = heroiSelecionado && obterPerfilRolagem ? obterPerfilRolagem(heroiSelecionado) : null;
  const infoHab = useMemo(
    () => detectarHabilidadePreConflito(perfilHeroi?.ficha),
    [perfilHeroi?.ficha]
  );

  const np = npOverride !== null ? npOverride : (infoHab?.possuiAltaVelocidade ? infoHab.np : 1);

  if (herois.length === 0) return null;

  const handleExecutar = async () => {
    if (!heroiSelecionado) return;
    await onExecutarAcaoPreRodada?.({
      heroiId: heroiSelecionado.id,
      tipoAcaoPre,
      np,
      alvoId: alvoId || null,
      relogioId: relogioId || null,
      condicaoId
    });
  };

  return (
    <div className={styles.preBarContainer}>
      <button
        type="button"
        className={styles.toggleHeaderBtn}
        onClick={() => setAberto((v) => !v)}
        title="Habilidades de Início de Conflito / Pré-1ª Rodada (ex.: Alta Velocidade)"
      >
        <div className={styles.titleRow}>
          <FaBolt className={styles.boltIcon} />
          <span className={styles.barTitle}>
            Ações Pré-1ª Rodada / Início de Conflito (ex.: Alta Velocidade)
          </span>
          {rodada === 1 && <Badge variant="gold" size="sm">1ª Rodada</Badge>}
          {infoHab.possuiAltaVelocidade && (
            <Badge variant="core" size="sm">{infoHab.nomeHabilidade} (NP {infoHab.np})</Badge>
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
              <label className={styles.fieldLabel}>Herói ({CUSTO_PM_ALTA_VELOCIDADE} PM):</label>
              <select
                className={styles.selectInput}
                value={heroiSelecionado?.id || ''}
                disabled={!isMestre && Boolean(meuHeroi)}
                onChange={(e) => { setHeroiId(e.target.value); setNpOverride(null); }}
              >
                {herois.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.nome} ({h.mp_atual}/{h.mp_max} PM)
                  </option>
                ))}
              </select>
            </div>

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

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Ação de Início de Conflito:</label>
              <select
                className={styles.selectInput}
                value={tipoAcaoPre}
                onChange={(e) => setTipoAcaoPre(e.target.value)}
              >
                {OPCOES_ACAO_PRE.map((op) => (
                  <option key={op.codigo} value={op.codigo}>{op.rotulo}</option>
                ))}
              </select>
            </div>

            {(tipoAcaoPre === 'ATAQUE_LIVRE' || tipoAcaoPre === 'IMPEDIMENTO') && (
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Alvo:</label>
                <select
                  className={styles.selectInput}
                  value={alvoId}
                  onChange={(e) => setAlvoId(e.target.value)}
                >
                  <option value="">-- Selecionar Alvo --</option>
                  {alvosDisponiveis.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome} ({a.tipo === 'heroi' ? 'Herói' : 'Inimigo'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {tipoAcaoPre === 'IMPEDIMENTO' && (
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Condição (Impedimento):</label>
                <select
                  className={styles.selectInput}
                  value={condicaoId}
                  onChange={(e) => setCondicaoId(e.target.value)}
                >
                  {CONDICOES_IMPEDIMENTO.map((c) => (
                    <option key={c.id} value={c.id}>{c.rotulo}</option>
                  ))}
                </select>
              </div>
            )}

            {tipoAcaoPre === 'OBJETIVO' && relogios.length > 0 && (
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Relógio de Objetivo:</label>
                <select
                  className={styles.selectInput}
                  value={relogioId}
                  onChange={(e) => setRelogioId(e.target.value)}
                >
                  <option value="">-- Nenhum Relógio --</option>
                  {relogios.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nome} ({r.fatias_atuais}/{r.fatias_total})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className={styles.actionFooter}>
            <span className={styles.ruleHint}>
              Gasta <strong>{CUSTO_PM_ALTA_VELOCIDADE} PM</strong> antes da 1ª rodada, soma <strong>+{np} (NP)</strong> ao teste e registra no feed sem consumir o turno normal.
            </span>
            <Button variant="gold" size="sm" onClick={handleExecutar}>
              <FaDice /> Executar (-{CUSTO_PM_ALTA_VELOCIDADE} PM, +{np} NP)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
