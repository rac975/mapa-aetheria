import { useCallback } from 'react';
import { combatService } from '../../services/combatService';
import {
  criarEventoOportunidade,
  registrarVotoOportunidade,
  resolverEfeitoOportunidade,
  construirLogOportunidadeAplicada
} from '../../domain/fabula/combatOpportunitiesRules';

/**
 * useCombatOpportunities
 * Gerencia o Modal e Votação de Oportunidades em Sucesso Crítico e Falha Crítica:
 * - Crítico ou Falha Crítica de Herói -> Mestre escolhe.
 * - Crítico ou Falha Crítica de Inimigo -> Heróis escolhem/votam.
 */
export function useCombatOpportunities({
  isMestre,
  estadoCombate,
  setEstadoCombate,
  setAcoesFeed,
  jogadorFichaId,
  jogadorNome,
  participantes = [],
  setParticipantes,
  relogios = [],
  setRelogios
}) {
  const oportunidadeAtiva = estadoCombate?.modificadores_globais?.oportunidade_ativa || null;

  const dispararOportunidadeCombate = useCallback(async ({ combatente, resultadoRolagem, origemAcao = '' }) => {
    const evento = criarEventoOportunidade({ combatente, resultadoRolagem, origemAcao });
    if (!evento) return null;

    const novosMods = {
      ...(estadoCombate?.modificadores_globais || {}),
      oportunidade_ativa: evento
    };
    setEstadoCombate((prev) => ({ ...prev, modificadores_globais: novosMods }));
    await combatService.updateEstadoCombate({ modificadores_globais: novosMods });
    return evento;
  }, [estadoCombate?.modificadores_globais, setEstadoCombate]);

  const votarOportunidadeCombate = useCallback(async (codigoOportunidade) => {
    if (!oportunidadeAtiva) return;
    const votante = jogadorNome || jogadorFichaId || (isMestre ? 'Mestre' : 'Herói');
    const atualizada = registrarVotoOportunidade(oportunidadeAtiva, votante, codigoOportunidade);

    const novosMods = {
      ...(estadoCombate?.modificadores_globais || {}),
      oportunidade_ativa: atualizada
    };
    setEstadoCombate((prev) => ({ ...prev, modificadores_globais: novosMods }));
    await combatService.updateEstadoCombate({ modificadores_globais: novosMods });
  }, [oportunidadeAtiva, jogadorNome, jogadorFichaId, isMestre, estadoCombate?.modificadores_globais, setEstadoCombate]);

  const confirmarOportunidadeCombate = useCallback(async (
    codigoEscolhido = null,
    detalheExtra = '',
    dadosEfeito = {}
  ) => {
    if (!oportunidadeAtiva) return;

    const efeitoResolvido = resolverEfeitoOportunidade({
      codigo: codigoEscolhido,
      dadosEfeito,
      participantes,
      relogios
    });

    if (efeitoResolvido?.updatesParticipante && setParticipantes) {
      const { id, ...updates } = efeitoResolvido.updatesParticipante;
      setParticipantes((prev) =>
        prev.map((p) => (String(p.id) === String(id) ? { ...p, ...updates } : p))
      );
      await combatService.updateParticipante(id, updates);
    }

    if (efeitoResolvido?.updatesRelogio && setRelogios) {
      const { id, ...updates } = efeitoResolvido.updatesRelogio;
      const novasFatias = Number(updates.fatias_atuais ?? updates.secoes_preenchidas);
      setRelogios((prev) =>
        prev.map((r) => (String(r.id) === String(id) ? { ...r, fatias_atuais: novasFatias } : r))
      );
      await combatService.avancarRelogioCombate(id, novasFatias);
    }

    const logEntry = construirLogOportunidadeAplicada(
      oportunidadeAtiva,
      codigoEscolhido,
      detalheExtra,
      efeitoResolvido
    );

    const novosMods = {
      ...(estadoCombate?.modificadores_globais || {}),
      oportunidade_ativa: null
    };
    setEstadoCombate((prev) => ({ ...prev, modificadores_globais: novosMods }));
    await combatService.updateEstadoCombate({ modificadores_globais: novosMods });

    const { data } = await combatService.registrarAcaoCombate(logEntry);
    if (data) {
      setAcoesFeed((prev) => [data, ...prev].slice(0, 30));
    } else {
      setAcoesFeed((prev) => [{ id: `local_${Date.now()}`, ...logEntry }, ...prev].slice(0, 30));
    }
  }, [
    oportunidadeAtiva,
    participantes,
    setParticipantes,
    relogios,
    setRelogios,
    estadoCombate?.modificadores_globais,
    setEstadoCombate,
    setAcoesFeed
  ]);

  const descartarOportunidadeCombate = useCallback(async () => {
    const novosMods = {
      ...(estadoCombate?.modificadores_globais || {}),
      oportunidade_ativa: null
    };
    setEstadoCombate((prev) => ({ ...prev, modificadores_globais: novosMods }));
    await combatService.updateEstadoCombate({ modificadores_globais: novosMods });
  }, [estadoCombate?.modificadores_globais, setEstadoCombate]);

  return {
    oportunidadeAtiva,
    dispararOportunidadeCombate,
    votarOportunidadeCombate,
    confirmarOportunidadeCombate,
    descartarOportunidadeCombate
  };
}
