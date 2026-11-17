import { useState, useMemo } from 'react';
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
import { normalizarTextoHF } from '../../../domain/fabula/highFantasyRules';

const possuiPoderOuHabTermo = (classes = [], poderesHeroicos = [], termo = '') => {
  const temPoder = (poderesHeroicos || []).some((p) => {
    const raw = typeof p === 'string' ? p : `${p?.key || ''} ${p?.nome || ''}`;
    return normalizarTextoHF(raw).includes(termo);
  });
  if (temPoder) return true;
  return (classes || []).some((c) =>
    (c.habilidades || []).some(
      (h) => normalizarTextoHF(h?.nome || '').includes(termo) && (parseInt(h.nivel, 10) || 0) > 0
    )
  );
};

export function useRitualCalculator({
  ficha,
  classes = [],
  atributos = {},
  statusFicha = null,
  handleAjustarRecurso
}) {
  const disciplinasDominadas = useMemo(() => {
    return detectarDisciplinasPersonagem(classes, ficha?.rituais, ficha?.peculiaridade);
  }, [classes, ficha?.rituais, ficha?.peculiaridade]);

  const todasDisciplinas = useMemo(() => Object.values(DISCIPLINAS_RITUAL), []);
  const [disciplinaIdSelecionada, setDisciplinaIdSelecionada] = useState(null);

  const disciplinaId = useMemo(() => {
    if (disciplinaIdSelecionada && todasDisciplinas.some((d) => d.id === disciplinaIdSelecionada)) {
      return disciplinaIdSelecionada;
    }
    return disciplinasDominadas[0]?.id || 'ritualismo';
  }, [disciplinaIdSelecionada, disciplinasDominadas, todasDisciplinas]);

  const [potenciaKey, setPotenciaKey] = useState('menor');
  const [areaKey, setAreaKey] = useState('individual');
  const [ingredienteRaro, setIngredienteRaro] = useState(false);
  const [incluirFoco, setIncluirFoco] = useState(true);
  const [incluirSimboloVerdade, setIncluirSimboloVerdade] = useState(true);
  const [incluirSimboloFeiticaria, setIncluirSimboloFeiticaria] = useState(false);
  const [incluirHipercognicao, setIncluirHipercognicao] = useState(false);
  const [descricaoEfeito, setDescricaoEfeito] = useState('');
  const [resultadoTeste, setResultadoTeste] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const disciplinaAtiva = useMemo(() => {
    return (
      disciplinasDominadas.find((d) => d.id === disciplinaId) ||
      DISCIPLINAS_RITUAL[disciplinaId] ||
      DISCIPLINAS_RITUAL.ritualismo
    );
  }, [disciplinasDominadas, disciplinaId]);

  const modificadores = useMemo(() => {
    const sinergias = statusFicha?.sinergias || {};
    const poderesHeroicos = statusFicha?.poderesHeroicosAtivos || ficha?.poderes_heroicos || [];
    const attrs = disciplinaAtiva.atributos || ['astucia', 'vontade'];
    const ehAstAst = attrs[0] === 'astucia' && attrs[1] === 'astucia';

    const temRituaisAgeis = possuiPoderOuHabTermo(classes, poderesHeroicos, 'rituais ageis');
    const temSelosRituais = possuiPoderOuHabTermo(classes, poderesHeroicos, 'selos rituais');
    const temNavegadorRitualismo =
      disciplinaAtiva.id === 'ritualismo' && possuiPoderOuHabTermo(classes, poderesHeroicos, 'navegador');

    const dobrarPmDecreto = Boolean(sinergias.decretoDobrarPmAtivo);
    const nvHipercognicao = sinergias.nvHipercognicao || 0;
    const qtdSimbolosFeiticariaInimigos = sinergias.simbolista?.qtdSimbolosFeiticariaInimigos || 0;
    const qtdSimbolosVerdadeInimigos = sinergias.simbolista?.qtdSimbolosVerdadeInimigos || 0;
    const bonusConcentrado = ehAstAst ? (sinergias.nvConcentrado || 0) : 0;
    const focoCognitivoAtivo = Boolean(sinergias.focoCognitivoAtivo && (sinergias.bonusFocoTeste || 0) > 0);
    const bonusFocoBase = sinergias.bonusFocoTeste || 0;

    return {
      temRituaisAgeis,
      temSelosRituais,
      temNavegadorRitualismo,
      dobrarPmDecreto,
      nvHipercognicao,
      qtdSimbolosFeiticariaInimigos,
      qtdSimbolosVerdadeInimigos,
      bonusConcentrado,
      focoCognitivoAtivo,
      bonusFocoBase
    };
  }, [classes, ficha?.poderes_heroicos, statusFicha, disciplinaAtiva]);

  const calculo = useMemo(() => {
    const reducaoHiper = incluirHipercognicao ? modificadores.nvHipercognicao : 0;
    const reducaoFeiticaria = incluirSimboloFeiticaria
      ? modificadores.qtdSimbolosFeiticariaInimigos * 5
      : 0;

    const baseParcial = calcularCustoRitual(potenciaKey, areaKey, {
      ingredienteRaro,
      dobrarPmDecreto: modificadores.dobrarPmDecreto,
      temRituaisAgeis: modificadores.temRituaisAgeis
    });

    const reducaoFeiticariaSegura =
      reducaoFeiticaria > 0 && baseParcial.custoTotal > 5
        ? Math.min(reducaoFeiticaria, baseParcial.custoTotal - 5)
        : 0;

    return calcularCustoRitual(potenciaKey, areaKey, {
      ingredienteRaro,
      dobrarPmDecreto: modificadores.dobrarPmDecreto,
      temRituaisAgeis: modificadores.temRituaisAgeis,
      reducaoPmExtra: reducaoFeiticariaSegura + reducaoHiper
    });
  }, [potenciaKey, areaKey, ingredienteRaro, incluirHipercognicao, incluirSimboloFeiticaria, modificadores]);

  const bonusTeste =
    modificadores.bonusConcentrado +
    (modificadores.focoCognitivoAtivo && incluirFoco ? modificadores.bonusFocoBase : 0) +
    (incluirSimboloVerdade ? modificadores.qtdSimbolosVerdadeInimigos * 2 : 0);

  const mpAtual = Number(ficha?.mp_atual ?? ficha?.pm_atual ?? 0);
  const validacaoPm = useMemo(() => {
    return validarConjuracaoRitual(mpAtual, calculo.custoTotal);
  }, [mpAtual, calculo.custoTotal]);

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

  const handleRolarTeste = () => {
    const res = rolarTesteRitual(
      dadosAtributos.valor1,
      dadosAtributos.valor2,
      calculo.nd,
      { bonus: bonusTeste }
    );
    setResultadoTeste(res);
    setFeedback(null);
  };

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
    setDisciplinaId: setDisciplinaIdSelecionada,
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
    modificadores,
    bonusTeste,
    toggles: {
      incluirFoco,
      setIncluirFoco,
      incluirSimboloVerdade,
      setIncluirSimboloVerdade,
      incluirSimboloFeiticaria,
      setIncluirSimboloFeiticaria,
      incluirHipercognicao,
      setIncluirHipercognicao
    },
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
