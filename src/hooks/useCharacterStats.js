import { useMemo, useCallback, useEffect } from 'react';
import { calcularStatusPersonagem } from '../utils/calculosFicha';
import { calcularNivelTotal } from '../domain/fabula/characterProgression';
import { calcularBonusPassivosPoderesHeroicos } from '../domain/fabula/heroicAndQuirksRules';
import { extrairEfeitosSimbolosAtivos } from '../domain/fabula/highFantasyRules';
import { extrairEfeitosAtivosNaturalFantasy } from '../domain/fabula/naturalFantasyRules';
import { calcularModificadoresCondicoesOficiais } from '../domain/fabula/coreClassRules';
import { fichaService } from '../services/fichaService';

const PROGRESSAO_DADOS = [6, 8, 10, 12, 20];

export function calcularModificadoresCondicoes(condicoes = [], imunidades = []) {
  return calcularModificadoresCondicoesOficiais(condicoes, imunidades);
}

/**
 * Hook customizado para isolar os cálculos dinâmicos de atributos, status,
 * imunidades e condições de regras de Fabula Ultima da ficha.
 */
export function useCharacterStats({
  ficha,
  classes = [],
  itensInventario = [],
  condicoesAtivas = [],
  modificadoresTemporarios = {},
  setModificadoresTemporarios
}) {
  const dadosMutanteAtual = useMemo(() => {
    const mutanteClass = (classes || []).find((c) =>
      (c.nome_classe || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('mutant')
    );
    const habTerio = (mutanteClass?.habilidades || []).find((h) =>
      (h.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('teriomorfose')
    );
    return mutanteClass?.dados_mutante || habTerio?.dados_mutante || ficha?.dados_mutante || {};
  }, [classes, ficha?.dados_mutante]);

  const terioformasAtivasLista = dadosMutanteAtual?.terioformasAtivas || [];
  const temTachytheria = terioformasAtivasLista.includes('tachytheria');
  const temArpaktida = terioformasAtivasLista.includes('arpaktida');
  const temDynamotheria = terioformasAtivasLista.includes('dynamotheria');

  const nivelTotalPersonagem = useMemo(() => calcularNivelTotal(classes) || 5, [classes]);

  const bonusHeroicosPassivos = useMemo(
    () => calcularBonusPassivosPoderesHeroicos(ficha?.poderes_heroicos || [], nivelTotalPersonagem),
    [ficha?.poderes_heroicos, nivelTotalPersonagem]
  );

  const efeitosSimbolosProprios = useMemo(
    () => extrairEfeitosSimbolosAtivos(classes, ficha),
    [classes, ficha]
  );

  const itensEquipados = useMemo(() => {
    return (itensInventario || []).filter((i) => i.stats_personalizados?.slot);
  }, [itensInventario]);

  const efeitosNaturalFantasy = useMemo(
    () =>
      extrairEfeitosAtivosNaturalFantasy({
        classes,
        ficha,
        itensEquipados,
        nivelTotal: nivelTotalPersonagem,
        catalogoMagiseeds: fichaService._catalogoFloralistaMagiseedsCache || []
      }),
    [classes, ficha, itensEquipados, nivelTotalPersonagem]
  );

  useEffect(() => {
    if (setModificadoresTemporarios) {
      setModificadoresTemporarios(
        calcularModificadoresCondicoes(condicoesAtivas, efeitosNaturalFantasy.imunidadesCondicaoNF)
      );
    }
  }, [condicoesAtivas, efeitosNaturalFantasy.imunidadesCondicaoNF, setModificadoresTemporarios]);

  const getAtributoAtualValor = useCallback(
    (nomeAtributo, valorBase) => {
      const idxBaseBruto = Math.max(0, PROGRESSAO_DADOS.indexOf(Number(valorBase) || 8));
      let bonusPermanenteOuForma =
        (bonusHeroicosPassivos.aumentosAtributo?.[nomeAtributo] || 0) +
        (efeitosNaturalFantasy.aumentosAtributoNF?.[nomeAtributo] || 0);

      if (nomeAtributo === 'destreza' && temTachytheria) bonusPermanenteOuForma += 1;
      if (nomeAtributo === 'astucia' && temArpaktida) bonusPermanenteOuForma += 1;
      if (nomeAtributo === 'vigor' && temDynamotheria) bonusPermanenteOuForma += 1;

      const idxComAprimoramento = Math.min(3, idxBaseBruto + bonusPermanenteOuForma);
      const modTemp = modificadoresTemporarios[nomeAtributo] || 0;
      let idxFinal = Math.max(0, Math.min(PROGRESSAO_DADOS.length - 1, idxComAprimoramento + modTemp));

      if (efeitosSimbolosProprios.travaAtributosBase) {
        idxFinal = Math.min(idxBaseBruto, idxFinal);
      }
      return PROGRESSAO_DADOS[idxFinal];
    },
    [
      modificadoresTemporarios,
      bonusHeroicosPassivos,
      efeitosNaturalFantasy.aumentosAtributoNF,
      temTachytheria,
      temArpaktida,
      temDynamotheria,
      efeitosSimbolosProprios.travaAtributosBase
    ]
  );

  const atributosAtuaisParaCalculo = useMemo(
    () => ({
      destreza: getAtributoAtualValor('destreza', ficha?.destreza),
      astucia: getAtributoAtualValor('astucia', ficha?.astucia),
      vigor: getAtributoAtualValor('vigor', ficha?.vigor),
      vontade: getAtributoAtualValor('vontade', ficha?.vontade),
      _jaAplicouHeroicos: true,
      _jaAplicouTerioformas: true,
      _jaAplicouNaturalFantasy: true
    }),
    [ficha?.destreza, ficha?.astucia, ficha?.vigor, ficha?.vontade, getAtributoAtualValor]
  );

  const statusFicha = useMemo(() => {
    return calcularStatusPersonagem(atributosAtuaisParaCalculo, classes, itensEquipados, ficha);
  }, [atributosAtuaisParaCalculo, classes, itensEquipados, ficha]);

  const hpAtualNum = Number(ficha?.hp_atual ?? statusFicha.pvMax);
  const emCriseGlobal = statusFicha?.pvMax ? hpAtualNum <= Math.floor(statusFicha.pvMax / 2) : false;

  return {
    itensEquipados,
    statusFicha,
    atributosAtuaisParaCalculo,
    emCriseGlobal,
    efeitosNaturalFantasy,
    dadosMutanteAtual,
    nivelTotalPersonagem
  };
}
