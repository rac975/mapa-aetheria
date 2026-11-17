import { useState } from 'react';
import {
  FaMagic,
  FaDice,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSkullCrossbones,
  FaStar,
  FaLeaf,
  FaFire,
  FaHourglassHalf,
  FaGhost,
  FaCompass
} from 'react-icons/fa';
import { Card, Button, Badge, Input } from '../../../components/ui';
import { useRitualCalculator } from './useRitualCalculator';
import styles from './FichaRituaisSecao.module.css';

const ICONES_DISCIPLINA = {
  arcanismo: FaStar,
  cloromancia: FaLeaf,
  elementalismo: FaFire,
  entropismo: FaHourglassHalf,
  espiritualismo: FaGhost,
  quimerismo: FaDice,
  ritualismo: FaCompass
};

export default function FichaRituaisSecao({
  ficha,
  classes = [],
  atributos = {},
  handleAjustarRecurso
}) {
  const {
    disciplinasDominadas,
    todasDisciplinas,
    disciplinaId,
    setDisciplinaId,
    disciplinaAtiva,
    potenciaKey,
    setPotenciaKey,
    areaKey,
    setAreaKey,
    ingredienteRaro,
    setIngredienteRaro,
    descricaoEfeito,
    setDescricaoEfeito,
    calculo,
    mpAtual,
    validacaoPm,
    dadosAtributos,
    resultadoTeste,
    feedback,
    handleRolarTeste,
    handleConjurarRitual,
    potencias,
    areas
  } = useRitualCalculator({ ficha, classes, atributos, handleAjustarRecurso });

  const [mostrarTodas, setMostrarTodas] = useState(false);
  const listaExibicao = (disciplinasDominadas.length > 0 && !mostrarTodas)
    ? disciplinasDominadas
    : todasDisciplinas;

  const IconeAtivo = ICONES_DISCIPLINA[disciplinaAtiva.id] || FaMagic;

  return (
    <Card variant="default" className={styles.container}>
      {/* 1. CABEÇALHO */}
      <div className={styles.header}>
        <div className={styles.headerTitleGroup}>
          <FaMagic className={styles.headerIcon} />
          <h3 className={styles.title}>Rituais Mágicos</h3>
          <Badge variant="ether" size="sm">
            {disciplinasDominadas.length} Disciplina(s) Ativa(s)
          </Badge>
        </div>
        <div className={styles.headerMeta}>
          <Badge variant={mpAtual > 0 ? 'pm' : 'crise'} size="md">
            PM Atual: {mpAtual}
          </Badge>
          {disciplinasDominadas.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setMostrarTodas(!mostrarTodas)}
              className={styles.toggleTodasBtn}
            >
              {mostrarTodas ? 'Ver Apenas Dominadas' : 'Ver Todas do Manual'}
            </Button>
          )}
        </div>
      </div>

      {/* 2. SELEÇÃO DE DISCIPLINAS */}
      <div className={styles.disciplinasContainer}>
        <span className={styles.sectionLabel}>Disciplina de Ritual:</span>
        <div className={styles.disciplinasPills}>
          {listaExibicao.map((disc) => {
            const isSelected = disc.id === disciplinaId;
            const ehDominada = disciplinasDominadas.some((d) => d.id === disc.id);
            const DiscIcon = ICONES_DISCIPLINA[disc.id] || FaMagic;

            return (
              <button
                type="button"
                key={disc.id}
                onClick={() => setDisciplinaId(disc.id)}
                className={`${styles.disciplinaPill} ${isSelected ? styles.disciplinaPillAtiva : ''} ${!ehDominada ? styles.disciplinaNaoDominada : ''}`}
              >
                <DiscIcon className={styles.pillIcon} />
                <span>{disc.nome}</span>
                <span className={styles.pillSigla}>{disc.sigla}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.disciplinaInfoCard}>
          <div className={styles.disciplinaInfoHeader}>
            <div className={styles.disciplinaInfoTitle}>
              <IconeAtivo /> {disciplinaAtiva.nome}
            </div>
            <Badge variant="gold" size="sm">
              Teste: {dadosAtributos.rotulo} (d{dadosAtributos.valor1} + d{dadosAtributos.valor2})
            </Badge>
          </div>
          <p className={styles.disciplinaDescricao}>{disciplinaAtiva.descricao}</p>
          {disciplinaAtiva.fontes && disciplinaAtiva.fontes.length > 0 && (
            <div className={styles.disciplinaFontes}>
              <FaCheckCircle className={styles.checkMini} />
              <span>{disciplinaAtiva.fontes.join(' • ')}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. PARÂMETROS DO RITUAL (POTÊNCIA E ÁREA) */}
      <div className={styles.parametrosGrid}>
        {/* Potência */}
        <div className={styles.parametroColuna}>
          <span className={styles.sectionLabel}>Potência do Efeito:</span>
          <div className={styles.opcoesLista}>
            {potencias.map((pot) => (
              <button
                type="button"
                key={pot.key}
                onClick={() => setPotenciaKey(pot.key)}
                className={`${styles.opcaoCard} ${potenciaKey === pot.key ? styles.opcaoCardAtiva : ''}`}
              >
                <div className={styles.opcaoTopo}>
                  <strong className={styles.opcaoNome}>{pot.nome}</strong>
                  <div className={styles.opcaoBadges}>
                    <Badge variant="ether" size="sm">{pot.custoPm} PM</Badge>
                    <Badge variant="gold" size="sm">ND {pot.nd}</Badge>
                  </div>
                </div>
                <span className={styles.opcaoExemplo}>{pot.exemplos}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Área */}
        <div className={styles.parametroColuna}>
          <span className={styles.sectionLabel}>Área / Alvos:</span>
          <div className={styles.opcoesLista}>
            {areas.map((ar) => (
              <button
                type="button"
                key={ar.key}
                onClick={() => setAreaKey(ar.key)}
                className={`${styles.opcaoCard} ${areaKey === ar.key ? styles.opcaoCardAtiva : ''}`}
              >
                <div className={styles.opcaoTopo}>
                  <strong className={styles.opcaoNome}>{ar.nome}</strong>
                  <Badge variant="core" size="sm">Multiplicador ×{ar.multiplicador}</Badge>
                </div>
                <span className={styles.opcaoExemplo}>{ar.descricao}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. MODIFICADORES & PROPÓSITO */}
      <div className={styles.modificadoresRow}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={ingredienteRaro}
            onChange={(e) => setIngredienteRaro(e.target.checked)}
            className={styles.checkboxInput}
          />
          <span>Usar Ingrediente Raro / Oferenda Preciosa (Reduz custo total de PM em 50%)</span>
        </label>
        <Input
          placeholder="Descreva o propósito ou objetivo do ritual (opcional)..."
          value={descricaoEfeito}
          onChange={(e) => setDescricaoEfeito(e.target.value)}
          className={styles.inputProposito}
        />
      </div>

      {/* 5. PAINEL DE RESULTADO E CUSTO CALCULADO */}
      <div className={styles.resumoPainel}>
        <div className={styles.resumoMetricas}>
          <div className={styles.metricaItem}>
            <span className={styles.metricaRotulo}>Custo Total</span>
            <Badge variant={validacaoPm.podeConjurar ? 'pm' : 'crise'} size="md" className={styles.metricaBadge}>
              {calculo.custoTotal} PM
            </Badge>
          </div>
          <div className={styles.metricaItem}>
            <span className={styles.metricaRotulo}>Dificuldade</span>
            <Badge variant="gold" size="md" className={styles.metricaBadge}>
              ND {calculo.nd}
            </Badge>
          </div>
          <div className={styles.metricaItem}>
            <span className={styles.metricaRotulo}>Relógio em Conflito</span>
            <Badge variant="ether" size="md" className={styles.metricaBadge}>
              <FaClock /> {calculo.relogioSecoes} Seções
            </Badge>
          </div>
        </div>

        <div className={styles.acoesContainer}>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleRolarTeste}
            className={styles.acaoBtn}
          >
            <FaDice /> Rolar Magia {dadosAtributos.rotulo}
          </Button>
          <Button
            type="button"
            variant={validacaoPm.podeConjurar ? 'primary' : 'disabled'}
            size="md"
            onClick={handleConjurarRitual}
            disabled={!validacaoPm.podeConjurar}
            className={styles.acaoBtn}
          >
            <FaMagic /> Conjurar Ritual ({calculo.custoTotal} PM)
          </Button>
        </div>
      </div>

      {/* 6. RESULTADO DA ROLAGEM DE DADOS */}
      {resultadoTeste && (
        <div className={`${styles.resultadoCard} ${resultadoTeste.desastre ? styles.resultadoDesastre : resultadoTeste.critico ? styles.resultadoCritico : resultadoTeste.sucesso ? styles.resultadoSucesso : styles.resultadoFalha}`}>
          <div className={styles.resultadoTopo}>
            <div className={styles.resultadoFormula}>
              Rolagem: <strong>[{resultadoTeste.dado1}]</strong> + <strong>[{resultadoTeste.dado2}]</strong> = <span className={styles.resultadoTotal}>{resultadoTeste.total}</span> (vs ND {resultadoTeste.nd})
            </div>
            {resultadoTeste.desastre ? (
              <Badge variant="crise" size="sm"><FaSkullCrossbones /> DESASTRE (1 Ponto de Fábula)</Badge>
            ) : resultadoTeste.critico ? (
              <Badge variant="core" size="sm"><FaStar /> SUCESSO CRÍTICO (+Oportunidade)</Badge>
            ) : resultadoTeste.sucesso ? (
              <Badge variant="core" size="sm"><FaCheckCircle /> SUCESSO (Margem +{resultadoTeste.margem})</Badge>
            ) : (
              <Badge variant="crise" size="sm"><FaExclamationTriangle /> FALHA (Margem {resultadoTeste.margem})</Badge>
            )}
          </div>
        </div>
      )}

      {/* 7. FEEDBACK DE CONJURAÇÃO */}
      {feedback && (
        <div className={`${styles.feedbackBox} ${feedback.tipo === 'sucesso' ? styles.feedbackSucesso : styles.feedbackErro}`}>
          {feedback.tipo === 'sucesso' ? <FaCheckCircle /> : <FaExclamationTriangle />}
          <span>{feedback.texto}</span>
        </div>
      )}

      {/* 8. VISUALIZAÇÃO EXCLUSIVA DE IMPRESSÃO (@media print) */}
      <div className={styles.printArea}>
        <h4>Rituais Mágicos — Disciplinas Conhecidas:</h4>
        <p>{disciplinasDominadas.map(d => `${d.nome} (${d.sigla})`).join(' • ') || 'Nenhum ritual dominado.'}</p>
        <p><strong>Fórmula de Custo:</strong> PM = Potência (Menor 20/ND7, Média 30/ND10, Maior 40/ND13, Extrema 50/ND16) × Área (Indiv. ×1, Peq. ×2, Gde. ×3, Enor. ×4).</p>
      </div>
    </Card>
  );
}
