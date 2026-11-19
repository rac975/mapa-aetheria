import { useState, useEffect, useCallback } from 'react';
import { cronicaService } from '../services/cronicaService';

/**
 * Hook customizado para gerenciamento de estado, ciclo de vida e operações de Crônicas.
 * Isola chamadas de serviço e realtime conforme diretrizes do GEMINI.md.
 */
export function useCronicas() {
  const [cronicas, setCronicas] = useState([]);
  const [tagsDisponiveis, setTagsDisponiveis] = useState([]);
  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const [carregandoPontual, setCarregandoPontual] = useState(false);
  const [erro, setErro] = useState(null);

  const processarTagsUnicas = useCallback((lista) => {
    const todasTags = lista
      .map((c) => c.tags)
      .filter(Boolean)
      .flatMap((t) => t.split(',').map((tag) => tag.trim()))
      .filter((t) => t.length > 0);
    setTagsDisponiveis([...new Set(todasTags)]);
  }, []);

  const buscarCronicas = useCallback(async ({ pontual = false } = {}) => {
    if (pontual) {
      setCarregandoPontual(true);
    }
    setErro(null);

    try {
      const { data: lista, error } = await cronicaService.getCronicas();
      if (error) throw error;
      const res = lista || [];
      setCronicas(res);
      processarTagsUnicas(res);
    } catch (err) {
      console.error('[useCronicas] Erro ao buscar crônicas:', err.message);
      setErro(err.message || 'Erro ao carregar crônicas.');
    } finally {
      setCarregandoInicial(false);
      setCarregandoPontual(false);
    }
  }, [processarTagsUnicas]);

  useEffect(() => {
    buscarCronicas({ pontual: false });

    const channel = cronicaService.subscribeCronicas(() => {
      buscarCronicas({ pontual: true });
    });

    return () => {
      cronicaService.removeChannel(channel);
    };
  }, [buscarCronicas]);

  const salvarCronica = useCallback(async (dados, editandoId = null) => {
    setCarregandoPontual(true);
    try {
      if (editandoId) {
        const { error } = await cronicaService.atualizarCronica(editandoId, dados);
        if (error) throw error;
      } else {
        const { error } = await cronicaService.criarCronica(dados);
        if (error) throw error;
      }
      await buscarCronicas({ pontual: true });
      return { success: true };
    } catch (err) {
      console.error('[useCronicas] Erro ao salvar crônica:', err.message);
      setCarregandoPontual(false);
      return { success: false, error: err };
    }
  }, [buscarCronicas]);

  const excluirCronica = useCallback(async (id) => {
    try {
      const { error } = await cronicaService.excluirCronica(id);
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('[useCronicas] Erro ao excluir crônica:', err.message);
      return { success: false, error: err };
    }
  }, []);

  return {
    cronicas,
    setCronicas,
    tagsDisponiveis,
    carregandoInicial,
    carregandoPontual,
    erro,
    buscarCronicas,
    salvarCronica,
    excluirCronica
  };
}
