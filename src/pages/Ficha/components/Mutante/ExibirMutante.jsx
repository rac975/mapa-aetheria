import { useState } from 'react';
import { FaDna, FaHeart, FaFistRaised, FaExclamationTriangle, FaCheck, FaRedo } from 'react-icons/fa';
import { Button, Badge } from '../../../../components/ui';
import { fichaService } from '../../../../services/fichaService';
import {
  THERIOFORMS_CATALOG,
  THERIOMORPHOSIS_MAX_ACTIVE_DEFAULT,
  calcularCustoAtivacaoTeriomorfose,
  validarManifestacaoTerioformas,
  calcularBonusAkromorphosis,
  processarBiophageCura
} from '../../../../domain/fabula/technoFantasyRules';
import styles from './ExibirMutante.module.css';

export default function ExibirMutante({
  ficha,
  classe,
  classeObjeto,
  classes,
  handleAjustarRecurso,
  emCriseGlobal,
  pvMaxCalculado
}) {
  const classeObj =
    classe || classeObjeto ||
    classes?.find(c => (c.nome_classe || '').toLowerCase().includes('mutant')) ||
    (ficha?.habilidades ? ficha : null);

  const habs = classeObj?.habilidades || [];
  const getNivel = termo => {
    const h = habs.find(item =>
      (item.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(termo)
    );
    return parseInt(h?.nivel, 10) || 0;
  };

  const nivelMutante = parseInt(classeObj?.nivel, 10) || 1;
  const nvTeriomorfose = getNivel('teriomorfose');
  const nvAcromorfose = getNivel('acromorfose');
  const nvBiofago = getNivel('biofago');

  const pvMax = pvMaxCalculado || Number(ficha?.hp_max ?? 30);
  const pvAtual = Number(ficha?.hp_atual ?? ficha?.pv_atual ?? pvMax);
  const limiteCrise = Math.floor(pvMax / 2);
  const isCrise = emCriseGlobal !== undefined ? emCriseGlobal : pvAtual <= limiteCrise;

  const dadosMutanteSalvos = ficha?.dados_mutante || {};
  const [terioformasAtivas, setTerioformasAtivas] = useState(dadosMutanteSalvos.terioformasAtivas || []);
  const [teriomorfoseManifestada, setTeriomorfoseManifestada] = useState(dadosMutanteSalvos.teriomorfoseManifestada || false);
  const [categoriaArma, setCategoriaArma] = useState(dadosMutanteSalvos.categoriaArma || 'Armas de Luta');
  const [feedback, setFeedback] = useState('');

  const custoTeriomorfose = calcularCustoAtivacaoTeriomorfose(pvAtual);
  const bonusAcro = calcularBonusAkromorphosis(nvAcromorfose);
  const curaBiofago = processarBiophageCura(nvBiofago, isCrise);

  const salvarMutante = (novosDados = {}) => {
    if (ficha?.id) {
      fichaService.salvarDadosMutante(ficha.id, {
        terioformasAtivas, teriomorfoseManifestada, categoriaArma,
        ...novosDados
      });
    }
  };

  const handleToggleTerioforma = key => {
    let novasFormas;
    if (terioformasAtivas.includes(key)) {
      novasFormas = terioformasAtivas.filter(k => k !== key);
    } else {
      if (terioformasAtivas.length >= THERIOMORPHOSIS_MAX_ACTIVE_DEFAULT) {
        window.alert(`Limite atingido! Teriomorfose permite no máximo ${THERIOMORPHOSIS_MAX_ACTIVE_DEFAULT} terioformas simultâneas.`);
        return;
      }
      novasFormas = [...terioformasAtivas, key];
    }

    const validacao = validarManifestacaoTerioformas(novasFormas, THERIOMORPHOSIS_MAX_ACTIVE_DEFAULT);
    if (!validacao.valido) {
      window.alert(validacao.mensagem);
      return;
    }
    setTerioformasAtivas(novasFormas);
    salvarMutante({ terioformasAtivas: novasFormas });
  };

  const handleAtivarTeriomorfose = () => {
    if (terioformasAtivas.length === 0) {
      window.alert('Selecione pelo menos 1 Terioforma antes de manifestar a Teriomorfose!');
      return;
    }
    if (pvAtual <= custoTeriomorfose) {
      window.alert(`PV insuficiente! Custo de 1/3 do PV é ${custoTeriomorfose} PV.`);
      return;
    }
    if (handleAjustarRecurso && custoTeriomorfose > 0) {
      handleAjustarRecurso('hp_atual', -custoTeriomorfose);
    }
    setTeriomorfoseManifestada(true);
    setFeedback(`Teriomorfose manifestada com sucesso! Gasto de ${custoTeriomorfose} PV (1/3 do PV atual).`);
    salvarMutante({ teriomorfoseManifestada: true });
  };

  const handleEncerrarCena = () => {
    setTeriomorfoseManifestada(false);
    setTerioformasAtivas([]);
    setFeedback('Terioformas dissipadas no fim da cena.');
    salvarMutante({ teriomorfoseManifestada: false, terioformasAtivas: [] });
  };

  const handleCuraBiofago = () => {
    if (!handleAjustarRecurso || curaBiofago <= 0) return;
    handleAjustarRecurso('hp_atual', curaBiofago);
    setFeedback(`Biófago ativado! Regenerados +${curaBiofago} PV com sucesso.`);
  };

  return (
    <div className={styles.container}>
      {/* Cabeçalho */}
      <div className={styles.header}>
        <div className={styles.title}>
          <FaDna /> Aberração Fisiológica — Mutante
        </div>
        <Badge variant="core" size="md">Nível {nivelMutante}</Badge>
      </div>

      {/* 1. ALERTA DE CURA DO BIÓFAGO EM CRISE */}
      {nvBiofago > 0 && isCrise ? (
        <div className={styles.criseAlertBox}>
          <div className={styles.criseContent}>
            <div className={styles.criseTitle}>
              <FaExclamationTriangle /> Alerta de Biófago Ativo (Em Crise!)
            </div>
            <div className={styles.criseDesc}>
              Seu PV está em Crise (≤ {limiteCrise} PV). Ao causar dano a um ou mais inimigos, recupere +{curaBiofago} PV imediatamente.
            </div>
          </div>
          <Button variant="danger" size="sm" onClick={handleCuraBiofago}>
            <FaHeart /> Aplicar Cura (+{curaBiofago} PV)
          </Button>
        </div>
      ) : nvBiofago > 0 ? (
        <div className={styles.sectionHeader}>
          <Badge variant="default" size="sm">
            Biófago: Inativo (Requer Crise: PV ≤ {limiteCrise})
          </Badge>
        </div>
      ) : null}

      {/* 2. ATIVADOR DE TERIOMORFOSE E SELETOR DE TERIOFORMAS */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>
            <FaDna /> Teriomorfose {nvTeriomorfose > 0 ? `(Nv. ${nvTeriomorfose})` : ''}
          </span>
          <Badge variant={teriomorfoseManifestada ? 'core' : 'default'} size="sm">
            {terioformasAtivas.length}/{THERIOMORPHOSIS_MAX_ACTIVE_DEFAULT} Formas Selecionadas
          </Badge>
        </div>

        <div className={styles.terioformasGrid}>
          {THERIOFORMS_CATALOG.map(tf => {
            const isSelected = terioformasAtivas.includes(tf.key);
            return (
              <div
                key={tf.key}
                onClick={() => handleToggleTerioforma(tf.key)}
                className={`${styles.terioCard} ${isSelected ? styles.terioCardActive : ''}`}
              >
                <div className={styles.terioCardHeader}>
                  <span>{tf.nome}</span>
                  {isSelected && <Badge variant="core" size="sm"><FaCheck /> Ativa</Badge>}
                </div>
                <div className={styles.terioCardDesc}>{tf.descricao}</div>
              </div>
            );
          })}
        </div>

        <div className={styles.terioActionsRow}>
          <div>
            <Badge variant="pv" size="sm">
              Custo Ativação: {custoTeriomorfose} PV (1/3 de {pvAtual} PV)
            </Badge>
          </div>
          <div className={styles.clockButtons}>
            <Button
              variant={teriomorfoseManifestada ? 'secondary' : 'primary'}
              size="sm"
              onClick={handleAtivarTeriomorfose}
              disabled={terioformasAtivas.length === 0}
            >
              <FaDna /> {teriomorfoseManifestada ? 'Renovar Teriomorfose' : 'Manifestar na Cena'} (-{custoTeriomorfose} PV)
            </Button>
            {teriomorfoseManifestada && (
              <Button variant="ghost" size="sm" onClick={handleEncerrarCena}>
                <FaRedo /> Dissipar Formas
              </Button>
            )}
          </div>
        </div>

        <div className={styles.printOnly}>
          {terioformasAtivas.length > 0 ? (
            <div>Terioformas Ativas: {terioformasAtivas.join(', ')}</div>
          ) : (
            <div>Nenhuma terioforma ativa na cena.</div>
          )}
        </div>
      </div>

      {/* 3. CONTROLE DE ACROMORFOSE */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>
            <FaFistRaised /> Acromorfose {nvAcromorfose > 0 ? `(Nv. ${nvAcromorfose})` : ''}
          </span>
          <Badge variant="gold" size="sm">
            +{bonusAcro.bonusPrecisao} Precisão • +{bonusAcro.bonusDanoFisico} Dano Desarmado
          </Badge>
        </div>

        <div className={styles.acromorfoseRow}>
          <label className={styles.criseDesc}>Categoria de Armas Aplicada:</label>
          <select
            value={categoriaArma}
            onChange={e => setCategoriaArma(e.target.value)}
            className={styles.select}
          >
            <option value="Armas de Luta">Armas de Luta (Brawling)</option>
            <option value="Armas Brancas / Espadas">Armas Brancas / Espadas</option>
            <option value="Armas Pesadas">Armas Pesadas (Heavy)</option>
            <option value="Adagas">Adagas (Daggers)</option>
          </select>
          <Badge variant="core" size="sm">Conta como {categoriaArma}</Badge>
        </div>

        <div className={styles.printOnly}>
          Acromorfose ativa: Ataques desarmados contam como {categoriaArma}, recebendo +{bonusAcro.bonusPrecisao} Precisão e +{bonusAcro.bonusDanoFisico} Dano Físico.
        </div>
      </div>

      {feedback && (
        <div className={styles.feedbackBox}>
          <FaCheck /> {feedback}
        </div>
      )}
    </div>
  );
}
