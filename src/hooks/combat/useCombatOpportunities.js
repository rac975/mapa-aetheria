import { useCallback } from 'react';
import { combatService } from '../../services/combatService';
import {
  criarEventoOportunidade,
  registrarVotoOportunidade,
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
  jogadorNome
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

  const confirmarOportunidadeCombate = useCallback(async (codigoEscolhido = null, detalheExtra = '') => {
    if (!oportunidadeAtiva) return;
    const logEntry = construirLogOportunidadeAplicada(oportunidadeAtiva, codigoEscolhido, detalheExtra);

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
  }, [oportunidadeAtiva, estadoCombate?.modificadores_globais, setEstadoCombate, setAcoesFeed]);

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
