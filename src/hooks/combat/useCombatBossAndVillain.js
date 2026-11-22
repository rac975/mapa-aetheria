import { useCallback } from 'react';
import { combatService } from '../../services/combatService';
import {
  consumirPontoVilaoNpc,
  executarTransicaoFaseChefao
} from '../../domain/fabula/combatRules';

/**
 * useCombatBossAndVillain
 * Gerencia consumo de Pontos de Vilão, transição de fases de Chefes e ações por turno de NPCs.
 */
export function useCombatBossAndVillain({
  isMestre,
  participantes,
  setParticipantes,
  setAcoesFeed,
  setAlerta
}) {
  const gastarPontoVilaoCombate = useCallback(async (id, codigoAcao = 'INVOCAR_TRACO') => {
    if (!isMestre) return false;
    const lista = participantes || [];
    const participanteAtual = lista.find((p) => p.id === id);
    if (!participanteAtual) return false;

    const resultado = consumirPontoVilaoNpc(participanteAtual, { codigoAcao });
    if (!resultado.valido) {
      setAlerta({ isOpen: true, type: 'warning', title: 'Pontos de Vilão Insuficientes', message: resultado.erro });
      return false;
    }

    const { entidadeAtualizada, acaoInfo, resumo } = resultado;
    const updates = {
      pontos_vilao: entidadeAtualizada.pontos_vilao,
      pontos_ultima: entidadeAtualizada.pontos_ultima,
      mp_atual: entidadeAtualizada.mp_atual,
      condicoes: entidadeAtualizada.condicoes
    };

    setParticipantes((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    await combatService.updateParticipante(id, updates);

    if (participanteAtual.modificadores?.npc_id) {
      await combatService.updateNpcMestreFromCombat(participanteAtual.modificadores.npc_id, updates);
    }

    const { data } = await combatService.registrarAcaoCombate({
      combatente_id: id,
      autor_nome: participanteAtual.nome,
      autor_tipo: 'inimigo',
      acao_codigo: `VILAO_${codigoAcao}`,
      acao_titulo: `💀 ${acaoInfo.titulo}`,
      detalhes: resumo,
      metadata: {
        pontos_vilao_restantes: updates.pontos_vilao,
        custo: resultado.custoAplicado
      }
    });
    if (data) {
      setAcoesFeed((prev) => [data, ...prev].slice(0, 30));
    }

    return true;
  }, [isMestre, participantes, setAlerta, setParticipantes, setAcoesFeed]);

  const transicionarFaseChefeCombate = useCallback(async (id, numeroFaseDestino = null) => {
    if (!isMestre) return false;
    const lista = participantes || [];
    const participanteAtual = lista.find((p) => p.id === id);
    if (!participanteAtual) return false;

    const resultado = executarTransicaoFaseChefao(participanteAtual, numeroFaseDestino);
    if (!resultado.valido) {
      setAlerta({ isOpen: true, type: 'warning', title: 'Transição de Fase', message: resultado.erro });
      return false;
    }

    const { entidadeAtualizada, faseAtivada, resumo } = resultado;
    const updates = {
      fase_atual: entidadeAtualizada.fase_atual,
      acoes_por_turno: entidadeAtualizada.acoes_por_turno,
      hp_max: entidadeAtualizada.hp_max,
      hp_atual: entidadeAtualizada.hp_atual,
      mp_max: entidadeAtualizada.mp_max,
      mp_atual: entidadeAtualizada.mp_atual,
      dano_acumulado: 0,
      agiu: false,
      condicoes: entidadeAtualizada.condicoes,
      modificadores: entidadeAtualizada.modificadores
    };

    setParticipantes((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    await combatService.updateParticipante(id, updates);

    if (participanteAtual.modificadores?.npc_id) {
      await combatService.updateNpcMestreFromCombat(participanteAtual.modificadores.npc_id, updates);
    }

    const { data } = await combatService.registrarAcaoCombate({
      combatente_id: id,
      autor_nome: participanteAtual.nome,
      autor_tipo: 'inimigo',
      acao_codigo: 'TRANSICAO_FASE_CHEFE',
      acao_titulo: `🔥 ${faseAtivada.nome || `Fase ${entidadeAtualizada.fase_atual}`}`,
      detalhes: resumo,
      metadata: {
        fase_atual: entidadeAtualizada.fase_atual,
        hp_max: entidadeAtualizada.hp_max
      }
    });
    if (data) {
      setAcoesFeed((prev) => [data, ...prev].slice(0, 30));
    }

    setAlerta({
      isOpen: true,
      type: 'warning',
      title: `🔥 ${participanteAtual.nome} — ${faseAtivada.nome || `Fase ${entidadeAtualizada.fase_atual}`}`,
      message: resumo
    });

    return true;
  }, [isMestre, participantes, setAlerta, setParticipantes, setAcoesFeed]);

  const ajustarAcaoTurnoVilao = useCallback(async (id, deltaRealizadas = 1, novoTotalAcoes = null) => {
    if (!isMestre) return;
    const lista = participantes || [];
    const participanteAtual = lista.find((p) => p.id === id);
    if (!participanteAtual) return;

    const totalAcoes = novoTotalAcoes !== null && novoTotalAcoes !== undefined
      ? Math.max(1, Number(novoTotalAcoes) || 1)
      : Math.max(1, Number(participanteAtual.acoes_por_turno) || 1);

    const modsAtuais = participanteAtual.modificadores && typeof participanteAtual.modificadores === 'object'
      ? participanteAtual.modificadores
      : {};
    const realizadasAtuais = Math.max(0, Number(modsAtuais.acoes_realizadas_rodada) || 0);
    const novasRealizadas = Math.max(0, Math.min(totalAcoes, realizadasAtuais + (Number(deltaRealizadas) || 0)));
    const concluiuTodas = novasRealizadas >= totalAcoes;

    const updates = {
      acoes_por_turno: totalAcoes,
      agiu: concluiuTodas,
      turno_atual: concluiuTodas ? false : participanteAtual.turno_atual,
      modificadores: {
        ...modsAtuais,
        acoes_realizadas_rodada: novasRealizadas
      }
    };

    setParticipantes((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    await combatService.updateParticipante(id, updates);

    if (novoTotalAcoes !== null && participanteAtual.modificadores?.npc_id) {
      await combatService.updateNpcMestreFromCombat(participanteAtual.modificadores.npc_id, { acoes_por_turno: totalAcoes });
    }
  }, [isMestre, participantes, setParticipantes]);

  return {
    gastarPontoVilaoCombate,
    transicionarFaseChefeCombate,
    ajustarAcaoTurnoVilao
  };
}
