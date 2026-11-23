/**
 * Hook puro para orquestração e execução de Feitiços e Magias
 * Fabula Ultima - Clean Architecture: Execução imediata e sem botões inertes.
 */

import {
  classificarTipoMagia,
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
    const custoInfo = calcularCustoEfetivoMagia({
      magia,
      quantidadeAlvos: qtdAlvos,
      decretoDobrarPm: Boolean(perfil?.modificadoresCena?.decretoDobrarPm),
      usarVismagus: false
    });

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
      if (resolucao.curaPvFinal > 0) setCuraAplicada?.(resolucao.curaPvFinal);
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
            curaAplicada: resolucao.curaPvFinal,
            recursoCura: 'pv',
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

    const res = await onRolarDados({
      combatente,
      perfil,
      categoria: 'magia',
      titulo: `Conjurar: ${magia.nome}`,
      attr1: magia.attr1 || 'ast',
      attr2: magia.attr2 || 'von',
      bonusTeste: Number(magia.bonusPrecisao) || 0,
      bonusDano: Number(magia.bonusDano) || 0,
      calcularDano: true,
      tipoDano: magia.tipoDano || 'magico',
      custoPm: custoInfo.custoPm,
      isMulti: alvosLista.length > 1
    });

    if (!res) return null;

    setCustoPm?.(custoInfo.custoPm);
    if (magia.tipoDano) setTipoDano?.(magia.tipoDano);

    if (alvosLista.length > 0) {
      const danoBaseFeitico = res.danoTotal || (res.hr + (Number(magia.bonusDano) || 0));

      const resolucao = resolverAtaqueMultiAlvos({
        totalPrecisao: res.total,
        d1: res.d1,
        d2: res.d2,
        danoBase: danoBaseFeitico,
        tipoDano: magia.tipoDano || 'magico',
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
            tipoDano: magia.tipoDano || 'magico',
            afinidadeAlvo: item.afinidade,
            condicaoAlvo: item.condicaoAplicada,
            notaLivre: item.mensagem,
            marcarTurnoConcluido: ehPrimeiro ? marcarTurnoConcluido : false
          });
        }
      }

      return res;
    }

    if (res.danoTotal !== null) setDanoAplicado?.(res.danoTotal);
    setNotaLivre?.(`${magia.nome}: ${res.total} ${res.formulaDados} • RA ${res.hr}${res.statusCritico ? ` • ${res.statusCritico}` : ''}`);

    return res;
  };

  return { executarMagia };
}
