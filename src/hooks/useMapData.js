import { useState, useEffect, useCallback } from 'react';
import { mapService } from '../services/mapService';

/**
 * Hook customizado para carregar e sincronizar dados do mapa (Titãs e Rotas).
 * Desacopla a camada de apresentação das chamadas diretas ao serviço.
 */
export function useMapData() {
  const [titans, setTitans] = useState([]);
  const [rotas, setRotas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const carregarDados = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const { titans: titansData, rotas: rotasData, error: err } = await mapService.getDadosMapa({ forceRefresh });
      if (err) throw err;
      setTitans(titansData || []);
      setRotas(rotasData || []);
    } catch (err) {
      console.error('Erro ao carregar dados do mapa:', err);
      setError(err.message || 'Erro ao carregar mapa');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ativo = true;

    async function init() {
      try {
        const { titans: titansData, rotas: rotasData, error: err } = await mapService.getDadosMapa();
        if (!ativo) return;
        if (err) throw err;
        setTitans(titansData || []);
        setRotas(rotasData || []);
      } catch (err) {
        if (!ativo) return;
        console.error('Erro na inicialização dos dados do mapa:', err);
        setError(err.message || 'Erro ao carregar mapa');
      } finally {
        if (ativo) {
          setIsLoading(false);
        }
      }
    }

    init();

    return () => {
      ativo = false;
    };
  }, []);

  const updateTitanStatus = useCallback(async (id, novoStatus) => {
    try {
      const { error: err } = await mapService.atualizarStatusTitan(id, novoStatus);
      if (err) throw err;

      setTitans((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: novoStatus } : t))
      );

      return { success: true };
    } catch (err) {
      console.error('Erro ao atualizar status do Titã:', err);
      return { success: false, error: err };
    }
  }, []);

  return {
    titans,
    rotas,
    isLoading,
    error,
    refreshData: carregarDados,
    updateTitanStatus
  };
}
