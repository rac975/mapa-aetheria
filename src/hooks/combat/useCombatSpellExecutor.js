/**
 * Hook puro para orquestração e execução de Feitiços e Magias
 * Fabula Ultima - Clean Architecture: Execução imediata e sem botões inertes.
 */

import {
  classificarTipoMagia,
  extrairDadosOfensivosMagia,
  calcularCustoEfetivoMagia,
  validarRecursoConjuracao,
  resolverFeiticoSuporteCura
} from '../../domain/fabula/combatSpellResolutionRules.js';
import { resolverAtaqueMultiAlvos } from '../../domain/fabula/combatMultiAttackRules.js';

export function useCombatSpellExecutor({
  combatente,
  perfil,
  participantes = [],
  alvoId,
  alvosIds = [],
  multiAlvoAtivo = false,
  marcarTurnoConcluido = true,
  onExecutarAcao,
  onRolarDados,
  setDanoAplicado,
  setCuraAplicada,
  setTipoDano,
  setCustoPm,
  setNotaLivre
}) {
  const executarMagia = async (magia) => {
    if (!magia) return null;

    const alvosLista = multiAlvoAtivo && alvosIds.length > 0
      ? participantes.filter((p) => alvosIds.includes(String(p.id)))
      : (alvoId ? participantes.filter((p) => String(p.id) === String(alvoId)) : []);

    const qtdAlvos = Math.max(1, alvosLista.length);
    const decretoDobrar = Boolean(perfil?.modificadoresCena?.decretoDobrarPm);

    let custoInfo = calcularCustoEfetivoMagia({
      magia,
      quantidadeAlvos: qtdAlvos,
      decretoDobrarPm: decretoDobrar,
      usarVismagus: false
    });

    const mpAtual = Number(combatente?.mp_atual ?? combatente?.mp) || 0;
    const temVismagus = Boolean(
      perfil?.temVismagus ||
      perfil?.habilidades?.some((h) => h.codigo === 'VISMAGUS' || h.id === 'espiritualista_vismagus')
    );

    if (custoInfo.custoPm > mpAtual && temVismagus) {
      custoInfo = calcularCustoEfetivoMagia({
        magia,
        quantidadeAlvos: qtdAlvos,
        decretoDobrarPm: decretoDobrar,
        usarVismagus: true
      });
    }

    const validacao = validarRecursoConjuracao({
      combatente,
      custoPm: custoInfo.custoPm,
      custoPv: custoInfo.custoPv
    });

    if (!validacao.valido) {
      setNotaLivre?.(`⚠️ ${validacao.erro}`);
      return null;
    }

    const tipo = classificarTipoMagia(magia);

    // Feitiço de Suporte / Cura: Sucesso automático sem rolagem de dados
    if (tipo === 'suporte' || tipo === 'utilidade') {
      const resolucao = resolverFeiticoSuporteCura({
        magia,
        conjurador: combatente,
        alvos: alvosLista.length > 0 ? alvosLista : [combatente],
        custoPm: custoInfo.custoPm,
        custoPv: custoInfo.custoPv,
        bonusPoderCurativo: perfil?.bonusPoderCurativo || 0
      });

      setCustoPm?.(custoInfo.custoPm);
      const curaValor = resolucao.curaPvFinal > 0 ? resolucao.curaPvFinal : resolucao.curaPmFinal;
      const recursoCura = resolucao.curaPvFinal > 0 ? 'pv' : (resolucao.curaPmFinal > 0 ? 'pm' : 'pv');
      if (curaValor > 0) setCuraAplicada?.(curaValor);
      setNotaLivre?.(resolucao.detalhes);

      if (onExecutarAcao) {
        for (let i = 0; i < resolucao.updatesAlvos.length; i += 1) {
          const up = resolucao.updatesAlvos[i];
          const ehPrimeiro = i === 0;

          await onExecutarAcao({
            acaoCodigo: 'CONJURAR',
            atorId: combatente.id,
            alvoId: up.id,
            custoPm: ehPrimeiro ? custoInfo.custoPm : 0,
            custoPv: ehPrimeiro ? custoInfo.custoPv : 0,
            curaAplicada: curaValor,
            recursoCura,
            limparCondicoes: Boolean(up.condicoes !== undefined),
            notaLivre: resolucao.detalhes,
            marcarTurnoConcluido: ehPrimeiro ? marcarTurnoConcluido : false
          });
        }
      }

      return resolucao;
    }

    // Feitiço Ofensivo: Exige teste de Magia vs DEF.M
    if (!onRolarDados) return null;

    const infoOfensiva = extrairDadosOfensivosMagia(magia);
    const bonusDanoTotal = (Number(magia.bonusDano) || 0) + infoOfensiva.bonusDanoDescricao;
    const tipoDanoFinal = infoOfensiva.tipoDano;

    const res = await onRolarDados({
      combatente,
      perfil,
      categoria: 'magia',
      titulo: `Conjurar: ${magia.nome}`,
      attr1: magia.attr1 || 'ast',
      attr2: magia.attr2 || 'von',
      bonusTeste: Number(magia.bonusPrecisao) || 0,
      bonusDano: bonusDanoTotal,
      calcularDano: true,
      tipoDano: tipoDanoFinal,
      custoPm: custoInfo.custoPm,
      isMulti: false
    });

    if (!res) return null;

    setCustoPm?.(custoInfo.custoPm);
    if (tipoDanoFinal) setTipoDano?.(tipoDanoFinal);

    const danoBaseFeitico = res.danoTotal ?? (res.hr + bonusDanoTotal);

    if (alvosLista.length > 0) {
      const resolucao = resolverAtaqueMultiAlvos({
        totalPrecisao: res.total,
        d1: res.d1,
        d2: res.d2,
        danoBase: danoBaseFeitico,
        tipoDano: tipoDanoFinal,
        alvos: alvosLista,
        tipoDefesa: 'mdef',
        condicao: magia.condicao || ''
      });

      setNotaLivre?.(`${magia.nome} (Magia ${res.total} vs DEF.M): ${resolucao.resumoTexto}`);

      if (onExecutarAcao) {
        for (let i = 0; i < resolucao.resultadosAlvos.length; i += 1) {
          const item = resolucao.resultadosAlvos[i];
          const ehPrimeiro = i === 0;

          await onExecutarAcao({
            acaoCodigo: 'CONJURAR',
            atorId: combatente.id,
            alvoId: item.alvoId,
            custoPm: ehPrimeiro ? custoInfo.custoPm : 0,
            custoPv: ehPrimeiro ? custoInfo.custoPv : 0,
            danoAplicado: item.danoFinal,
            tipoDano: tipoDanoFinal,
            afinidadeAlvo: item.afinidade,
            condicaoAlvo: item.condicaoAplicada,
            notaLivre: item.mensagem,
            marcarTurnoConcluido: ehPrimeiro ? marcarTurnoConcluido : false
          });
        }
      }

      return res;
    }

    if (danoBaseFeitico !== null) setDanoAplicado?.(danoBaseFeitico);
    setNotaLivre?.(`${magia.nome}: ${res.total} ${res.formulaDados} • RA ${res.hr} • Dano ${danoBaseFeitico} (${tipoDanoFinal})${res.statusCritico ? ` • ${res.statusCritico}` : ''}`);

    return res;
  };

  return { executarMagia };
}
