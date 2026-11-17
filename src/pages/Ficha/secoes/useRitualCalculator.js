import { useState, useMemo, useEffect } from 'react';
import {
  DISCIPLINAS_RITUAL,
  POTENCIAS_RITUAL,
  AREAS_RITUAL,
  calcularCustoRitual,
  validarConjuracaoRitual,
  detectarDisciplinasPersonagem,
  rolarTesteRitual,
  extrairValorDadoRitual
} from '../../../domain/fabula/ritualRules';

export function useRitualCalculator({
  ficha,
  classes = [],
  atributos = {},
  handleAjustarRecurso
}) {
  // 1. Detectar todas as disciplinas dominadas pelo personagem
  const disciplinasDominadas = useMemo(() => {
    return detectarDisciplinasPersonagem(
      classes,
      ficha?.rituais,
      ficha?.peculiaridade
    );
  }, [classes, ficha?.rituais, ficha?.peculiaridade]);

  // Se nenhuma foi desbloqueada, disponibilizamos a lista completa ou Ritualismo como padrão
  const todasDisciplinas = useMemo(() => Object.values(DISCIPLINAS_RITUAL), []);

  const [disciplinaId, setDisciplinaId] = useState(() => {
    return disciplinasDominadas[0]?.id || 'ritualismo';
  });

  // Atualiza disciplina inicial quando a detecção for carregada
  useEffect(() => {
    if (disciplinasDominadas.length > 0 && !disciplinasDominadas.some(d => d.id === disciplinaId)) {
      setDisciplinaId(disciplinasDominadas[0].id);
    }
  }, [disciplinasDominadas, disciplinaId]);

  const [potenciaKey, setPotenciaKey] = useState('menor');
  const [areaKey, setAreaKey] = useState('individual');
  const [ingredienteRaro, setIngredienteRaro] = useState(false);
  const [descricaoEfeito, setDescricaoEfeito] = useState('');
  const [resultadoTeste, setResultadoTeste] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Disciplina ativa
  const disciplinaAtiva = useMemo(() => {
    return (
      disciplinasDominadas.find((d) => d.id === disciplinaId) ||
      DISCIPLINAS_RITUAL[disciplinaId] ||
      DISCIPLINAS_RITUAL.ritualismo
    );
  }, [disciplinasDominadas, disciplinaId]);

  // Cálculo matemático e limites de PM
  const calculo = useMemo(() => {
    return calcularCustoRitual(potenciaKey, areaKey, { ingredienteRaro });
  }, [potenciaKey, areaKey, ingredienteRaro]);

  const mpAtual = Number(ficha?.mp_atual ?? ficha?.pm_atual ?? 0);
  const validacaoPm = useMemo(() => {
    return validarConjuracaoRitual(mpAtual, calculo.custoTotal);
  }, [mpAtual, calculo.custoTotal]);

  // Atributos testados para a rolagem
  const dadosAtributos = useMemo(() => {
    const attrNomes = disciplinaAtiva.atributos || ['astucia', 'vontade'];
    const nome1 = attrNomes[0];
    const nome2 = attrNomes[1];

    const valor1 = extrairValorDadoRitual(atributos[nome1] || ficha?.[nome1] || 8);
    const valor2 = extrairValorDadoRitual(atributos[nome2] || ficha?.[nome2] || 8);

    return {
      nome1,
      nome2,
      valor1,
      valor2,
      rotulo: disciplinaAtiva.sigla || `[d${valor1} + d${valor2}]`
    };
  }, [disciplinaAtiva, atributos, ficha]);

  // Rolar Teste de Magia do Ritual
  const handleRolarTeste = () => {
    const res = rolarTesteRitual(
      dadosAtributos.valor1,
      dadosAtributos.valor2,
      calculo.nd
    );
    setResultadoTeste(res);
    setFeedback(null);
  };

  // Conjurar Ritual e Descontar PM
  const handleConjurarRitual = () => {
    if (!validacaoPm.podeConjurar) {
      setFeedback({
        tipo: 'erro',
        texto: validacaoPm.motivo || 'Pontos de Magia insuficientes!'
      });
      return;
    }

    if (handleAjustarRecurso) {
      handleAjustarRecurso('mp_atual', -calculo.custoTotal);
      setFeedback({
        tipo: 'sucesso',
        texto: `Ritual de ${disciplinaAtiva.nome} (${calculo.potencia.nome}) conjurado com sucesso! Descontados ${calculo.custoTotal} PM.`
      });
    }
  };

  return {
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
    potencias: Object.values(POTENCIAS_RITUAL),
    areas: Object.values(AREAS_RITUAL)
  };
}
