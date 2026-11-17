import { useState, useMemo } from 'react';
import { extrairFacesDadoHF, normalizarTextoHF } from '../domain/fabula/highFantasyRules';

const possuiPoderHeroicoTermo = (poderesHeroicos = [], termo = '') => {
  return (poderesHeroicos || []).some((p) => {
    const raw = typeof p === 'string' ? p : `${p?.key || ''} ${p?.nome || ''}`;
    return normalizarTextoHF(raw).includes(termo);
  });
};

export const extrairNumeroCustoMp = (custoBruto) => {
  if (typeof custoBruto === 'number') return Math.max(0, custoBruto);
  const match = String(custoBruto || '').match(/\d+/);
  return match ? Math.max(0, parseInt(match[0], 10) || 0) : 0;
};

export function useMagiasSecao({
  ficha,
  atributos = {},
  statusFicha = null,
  handleAjustarRecurso
}) {
  const [extraCataclismoPm, setExtraCataclismoPm] = useState(0);
  const [aplicarHipercognicao, setAplicarHipercognicao] = useState(false);
  const [focoAlvoUnico, setFocoAlvoUnico] = useState(false);
  const [aplicarFeiticaria, setAplicarFeiticaria] = useState(true);
  const [resultadosRolagem, setResultadosRolagem] = useState({});
  const [feedback, setFeedback] = useState(null);

  const resumo = useMemo(() => {
    const sinergias = statusFicha?.sinergias || {};
    const poderesHeroicos = statusFicha?.poderesHeroicosAtivos || ficha?.poderes_heroicos || [];
    const nivelTotal = Number(statusFicha?.nivelTotal) || 5;

    const temFeiticoPoderoso = possuiPoderHeroicoTermo(poderesHeroicos, 'feitico poderoso');
    const bonusFeiticoPoderoso = temFeiticoPoderoso ? (nivelTotal >= 40 ? 10 : 5) : 0;

    const nvCataclismo = sinergias.temArmaArcanaEquipada ? (sinergias.nvCataclismo || 0) : 0;
    const maxCataclismoPm = nvCataclismo * 10;

    const nvSimbolosMagicos = sinergias.simbolista?.nvSimbolosMagicos || 0;
    const limitePmSimbolosMagicos = nvSimbolosMagicos * 10;
    const qtdSimbolosFeiticaria = sinergias.simbolista?.qtdSimbolosFeiticariaInimigos || 0;
    const qtdSimbolosVerdade = sinergias.simbolista?.qtdSimbolosVerdadeInimigos || 0;

    const nvHipercognicao = sinergias.nvHipercognicao || 0;
    const focoCognitivoAtivo = Boolean(sinergias.focoCognitivoAtivo);
    const bonusArtilharia = sinergias.bonusArtilharia || 0;
    const bonusFocoTeste = sinergias.bonusFocoTeste || 0;
    const bonusPoderCurativo = sinergias.bonusPoderCurativo || 0;
    const bonusDanoDancarinoGuerra = sinergias.temArmaArcanaEquipada ? (sinergias.bonusDanoDancarinoGuerra || 0) : 0;
    const bonusDanoDecreto = sinergias.bonusDanoDecreto || 0;
    const decretoDobrarPmAtivo = Boolean(sinergias.decretoDobrarPmAtivo);
    const nvConsumir = sinergias.nvConsumir || 0;
    const nf = statusFicha?.naturalFantasy || {};
    const bonusCuraHarmoniaElemental = nf.invocador?.bonusCuraHarmonia || 0;
    const bonusDanoPragaElemental = nf.invocador?.bonusDanoPragaAtiva || 0;
    const limitePmJardinagemMarcial = nf.floralista?.limitePmJardinagemMarcial || 0;

    const bonusTesteMagia = bonusArtilharia + bonusFocoTeste + (qtdSimbolosVerdade * 2);

    return {
      bonusArtilharia,
      nvCataclismo,
      maxCataclismoPm,
      bonusPoderCurativo,
      bonusCuraHarmoniaElemental,
      bonusDanoPragaElemental,
      limitePmJardinagemMarcial,
      bonusFeiticoPoderoso,
      nvSimbolosMagicos,
      limitePmSimbolosMagicos,
      qtdSimbolosFeiticaria,
      qtdSimbolosVerdade,
      nvHipercognicao,
      focoCognitivoAtivo,
      bonusFocoTeste,
      bonusDanoDancarinoGuerra,
      bonusDanoDecreto,
      decretoDobrarPmAtivo,
      nvConsumir,
      bonusTesteMagia
    };
  }, [statusFicha, ficha?.poderes_heroicos]);

  const mpAtual = Number(ficha?.mp_atual ?? ficha?.pm_atual ?? 0);

  const calcularCustoMagia = (magia) => {
    const base = extrairNumeroCustoMp(magia?.custo_mp);
    const cataclismoEfetivo = Math.min(extraCataclismoPm, resumo.maxCataclismoPm);
    let custo = base + cataclismoEfetivo;

    if (resumo.decretoDobrarPmAtivo) {
      custo *= 2;
    }

    if (aplicarFeiticaria && resumo.qtdSimbolosFeiticaria > 0 && custo > 5) {
      custo = Math.max(5, custo - (resumo.qtdSimbolosFeiticaria * 5));
    }

    if (aplicarHipercognicao && resumo.nvHipercognicao > 0) {
      const desc = resumo.nvHipercognicao * (focoAlvoUnico ? 2 : 1);
      custo = Math.max(0, custo - desc);
    }

    return {
      base,
      cataclismoEfetivo,
      custoFinal: custo,
      danoCataclismo: Math.floor(cataclismoEfetivo / 10) * 5
    };
  };

  const rolarTesteMagia = (index, magia) => {
    const facesAst = extrairFacesDadoHF(atributos.astucia || ficha?.astucia, 8);
    const facesVon = extrairFacesDadoHF(atributos.vontade || ficha?.vontade, 8);
    const d1 = Math.floor(Math.random() * facesAst) + 1;
    const d2 = Math.floor(Math.random() * facesVon) + 1;
    const total = d1 + d2 + resumo.bonusTesteMagia;
    const desastre = d1 === 1 && d2 === 1;
    const critico = d1 === d2 && d1 >= 6;
    const hr = Math.max(d1, d2);
    const { danoCataclismo } = calcularCustoMagia(magia);
    const bonusDanoOfensivo =
      resumo.bonusFeiticoPoderoso +
      resumo.bonusDanoDancarinoGuerra +
      resumo.bonusDanoDecreto +
      danoCataclismo;

    setResultadosRolagem((prev) => ({
      ...prev,
      [index]: {
        facesAst,
        facesVon,
        d1,
        d2,
        bonus: resumo.bonusTesteMagia,
        total,
        hr,
        bonusDanoOfensivo,
        critico,
        desastre
      }
    }));
  };

  const lancarMagia = (magia) => {
    const { custoFinal } = calcularCustoMagia(magia);
    if (mpAtual < custoFinal) {
      setFeedback({
        tipo: 'erro',
        texto: `PM insuficiente para lançar ${magia.nome} (${custoFinal} PM necessários, ${mpAtual} PM disponíveis).`
      });
      return;
    }
    if (handleAjustarRecurso) {
      handleAjustarRecurso('mp_atual', -custoFinal);
      setFeedback({
        tipo: 'sucesso',
        texto: `${magia.nome} lançada! Descontados ${custoFinal} PM.`
      });
    }
  };

  return {
    resumo,
    mpAtual,
    extraCataclismoPm,
    setExtraCataclismoPm,
    aplicarHipercognicao,
    setAplicarHipercognicao,
    focoAlvoUnico,
    setFocoAlvoUnico,
    aplicarFeiticaria,
    setAplicarFeiticaria,
    resultadosRolagem,
    feedback,
    calcularCustoMagia,
    rolarTesteMagia,
    lancarMagia
  };
}
