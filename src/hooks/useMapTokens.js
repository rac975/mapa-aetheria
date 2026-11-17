import { useState, useEffect, useCallback } from 'react';
import { mapService, DEFAULT_MAP_TOKENS } from '../services/mapService';

/**
 * Hook para gerenciar estado e movimentação de tokens interativos no mapa de Aetheria.
 */
export function useMapTokens() {
  const [tokens, setTokens] = useState([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        const { tokens: dados } = await mapService.getTokensMapa();
        if (ativo && Array.isArray(dados)) {
          setTokens(dados);
        }
      } catch (err) {
        console.error('Erro ao carregar tokens do mapa:', err);
      } finally {
        if (ativo) setIsLoadingTokens(false);
      }
    }

    carregar();
    return () => {
      ativo = false;
    };
  }, []);

  const moveToken = useCallback(async (id, x, y) => {
    setTokens((prev) =>
      prev.map((tk) =>
        tk.id === id ? { ...tk, x: Number(x.toFixed(3)), y: Number(y.toFixed(3)) } : tk
      )
    );
    try {
      await mapService.atualizarPosicaoToken(id, x, y);
    } catch (err) {
      console.error('Erro ao persistir posição do token:', err);
    }
  }, []);

  const addToken = useCallback(async (novoToken) => {
    const tokenCompleto = {
      id: novoToken.id || `token-${Date.now()}`,
      nome: novoToken.nome || 'Novo Marcador',
      tipo: novoToken.tipo || 'navio',
      x: novoToken.x ?? 50,
      y: novoToken.y ?? 50,
      icone: novoToken.icone || 'ship',
      descricao: novoToken.descricao || ''
    };

    setTokens((prev) => {
      const atualizados = [...prev, tokenCompleto];
      mapService.salvarTokensMapa(atualizados);
      return atualizados;
    });
  }, []);

  const removeToken = useCallback(async (id) => {
    setTokens((prev) => {
      const atualizados = prev.filter((tk) => tk.id !== id);
      mapService.salvarTokensMapa(atualizados);
      return atualizados;
    });
  }, []);

  const resetTokens = useCallback(async () => {
    setTokens(DEFAULT_MAP_TOKENS);
    await mapService.salvarTokensMapa(DEFAULT_MAP_TOKENS);
  }, []);

  return {
    tokens,
    isLoadingTokens,
    moveToken,
    addToken,
    removeToken,
    resetTokens
  };
}
