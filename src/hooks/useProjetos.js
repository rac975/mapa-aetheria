import { useState, useEffect, useCallback } from 'react';
import { projetoService } from '../services/projetoService';
import { avancarRelogioProjeto } from '../domain/fabula/projetoRules';

/**
 * Custom Hook para gerenciar o estado, cache, realtime e mutações de Projetos.
 * Isola a camada de apresentação dos serviços e regras de domínio.
 */
export function useProjetos(isMestre = false) {
  const [projetos, setProjetos] = useState([]);
  const [personagens, setPersonagens] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const carregarDados = useCallback(async ({ forceRefresh = false } = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const [resProjetos, resPersonagens] = await Promise.all([
        projetoService.getProjetos({ forceRefresh }),
        projetoService.getPersonagensResumo({ forceRefresh })
      ]);

      if (resProjetos.error) throw resProjetos.error;
      setProjetos(resProjetos.data || []);

      if (!resPersonagens.error) {
        setPersonagens(resPersonagens.data || []);
      }
    } catch (err) {
      console.error('[useProjetos] Erro ao carregar projetos:', err);
      setError(err.message || 'Erro ao carregar projetos.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    projetoService.invalidarCache();
    carregarDados({ forceRefresh: true });
  }, [isMestre, carregarDados]);

  useEffect(() => {
    const subscription = projetoService.subscribeProjetos(() => {
      carregarDados({ forceRefresh: true });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [carregarDados]);

  const criarProjeto = useCallback(async (payload) => {
    setIsSaving(true);
    setError(null);
    try {
      const { data, error: err } = await projetoService.criarProjeto(payload);
      if (err) throw err;
      if (data) {
        setProjetos((prev) => [data, ...prev]);
      }
      return { data, error: null };
    } catch (err) {
      console.error('[useProjetos] Erro ao criar projeto:', err);
      setError(err.message || 'Não foi possível criar o projeto.');
      return { data: null, error: err };
    } finally {
      setIsSaving(false);
    }
  }, []);

  const atualizarProjeto = useCallback(async (id, updates) => {
    setIsSaving(true);
    setError(null);
    try {
      const { data, error: err } = await projetoService.atualizarProjeto(id, updates);
      if (err) throw err;
      if (data) {
        setProjetos((prev) => prev.map((p) => (p.id === id ? data : p)));
      }
      return { data, error: null };
    } catch (err) {
      console.error('[useProjetos] Erro ao atualizar projeto:', err);
      setError(err.message || 'Não foi possível atualizar o projeto.');
      return { data: null, error: err };
    } finally {
      setIsSaving(false);
    }
  }, []);

  const avancarProgresso = useCallback(async (projeto, delta) => {
    if (!projeto?.id) return { data: null, error: null };
    const calculo = avancarRelogioProjeto(projeto, delta);
    return await atualizarProjeto(projeto.id, {
      progresso_atual: calculo.progressoNovo,
      status: calculo.novoStatus
    });
  }, [atualizarProjeto]);

  const alternarVisibilidade = useCallback(async (projeto) => {
    if (!projeto?.id) return { data: null, error: null };
    return await atualizarProjeto(projeto.id, {
      visivel: !projeto.visivel
    });
  }, [atualizarProjeto]);

  const removerLocal = useCallback((id) => {
    setProjetos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const restaurarLocal = useCallback((projeto) => {
    setProjetos((prev) => {
      if (prev.some((p) => p.id === projeto.id)) return prev;
      return [projeto, ...prev];
    });
  }, []);

  const excluirProjeto = useCallback(async (id) => {
    const { error: err } = await projetoService.excluirProjeto(id);
    if (err) {
      console.error('[useProjetos] Erro ao excluir projeto:', err);
      setError(err.message || 'Erro ao excluir projeto.');
    }
    return { error: err };
  }, []);

  return {
    projetos,
    personagens,
    isLoading,
    isSaving,
    error,
    recarregar: () => carregarDados({ forceRefresh: true }),
    criarProjeto,
    atualizarProjeto,
    avancarProgresso,
    alternarVisibilidade,
    removerLocal,
    restaurarLocal,
    excluirProjeto
  };
}
