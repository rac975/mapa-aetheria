import { useState, useEffect, useCallback, useRef } from 'react';
import { npcService } from '../services/npcService';
import { useToast } from '../contexts/ToastContext';

// Cache compartilhado em memória para catálogos estáticos (evita refetching repetido)
let cachedCatalogos = null;
let fetchingCatalogosPromise = null;

async function obterCatalogosEstaticos() {
  if (cachedCatalogos) {
    return cachedCatalogos;
  }
  if (!fetchingCatalogosPromise) {
    fetchingCatalogosPromise = Promise.all([
      npcService.getCatalogoFeiticos(),
      npcService.getCatalogoPoderesNpc(),
      npcService.getCatalogoEspecies()
    ]).then(([fRes, pRes, eRes]) => {
      cachedCatalogos = {
        feiticos: fRes.data || [],
        poderes: pRes.data || [],
        especies: eRes.data || []
      };
      fetchingCatalogosPromise = null;
      return cachedCatalogos;
    }).catch(err => {
      fetchingCatalogosPromise = null;
      throw err;
    });
  }
  return fetchingCatalogosPromise;
}

/**
 * Hook para gerenciar estado, carregamento e operações de NPCs (Ficha individual e catálogos).
 * @param {string|number} npcId - ID do NPC a ser gerenciado
 * @param {Object} [options]
 * @param {Function} [options.onNavigateAway] - Callback caso o NPC não seja encontrado ou seja excluído
 * @returns {Object} Estados e métodos de manipulação do NPC
 */
export function useNPCManager(npcId, options = {}) {
  const { onNavigateAway } = options;
  const onNavigateAwayRef = useRef(onNavigateAway);
  useEffect(() => {
    onNavigateAwayRef.current = onNavigateAway;
  });

  const [npc, setNpc] = useState(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Catálogos
  const [catalogoFeiticos, setCatalogoFeiticos] = useState([]);
  const [catalogoPoderes, setCatalogoPoderes] = useState([]);
  const [catalogoEspecies, setCatalogoEspecies] = useState([]);

  // Carrega NPC e catálogos
  const carregarDados = useCallback(async () => {
    if (!npcId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [npcRes, cat] = await Promise.all([
        npcService.getNpcPorId(npcId),
        obterCatalogosEstaticos()
      ]);

      if (npcRes.error) {
        console.error('Erro ao carregar NPC:', npcRes.error);
        setError(npcRes.error);
        if (onNavigateAwayRef.current) onNavigateAwayRef.current();
        return;
      }

      setNpc(npcRes.data);
      setCatalogoFeiticos(cat.feiticos);
      setCatalogoPoderes(cat.poderes);
      setCatalogoEspecies(cat.especies);
    } catch (err) {
      console.error('Erro inesperado ao carregar dados do NPC:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [npcId]);

  useEffect(() => {
    let ativo = true;

    async function executar() {
      if (!ativo) return;
      await carregarDados();
    }

    void executar();

    return () => {
      ativo = false;
    };
  }, [carregarDados]);

  /**
   * Salva as alterações feitas no NPC no Supabase
   * @param {Object} npcAtualizado 
   * @returns {Promise<boolean>}
   */
  const salvarNpc = useCallback(async (npcAtualizado) => {
    setNpc(npcAtualizado);
    const { error: saveErr } = await npcService.updateNpc(npcId, npcAtualizado);
    if (saveErr) {
      console.error('Erro ao salvar NPC:', saveErr);
      setError(saveErr);
      return false;
    }
    return true;
  }, [npcId]);

  const { showUndoToast } = useToast();

  /**
   * Exclui o NPC atual após confirmação com UndoToast
   * @returns {Promise<boolean>}
   */
  const excluirNpc = useCallback(async () => {
    const npcSalvo = npc;
    if (onNavigateAwayRef.current) {
      onNavigateAwayRef.current();
    }

    showUndoToast({
      message: `NPC "${npcSalvo?.nome || 'Adversário'}" foi excluído do Bestiário.`,
      duration: 6000,
      onConfirm: async () => {
        const { error: delErr } = await npcService.deleteNpc(npcId);
        if (delErr) {
          console.error('Erro ao excluir NPC permanentemente:', delErr);
          setError(delErr);
        }
      },
      onUndo: () => {
        console.log('Exclusão de NPC revertida.');
      }
    });

    return true;
  }, [npc, npcId, showUndoToast]);

  return {
    npc,
    setNpc,
    modoEdicao,
    setModoEdicao,
    loading,
    error,
    catalogoFeiticos,
    catalogoPoderes,
    catalogoEspecies,
    carregarDados,
    salvarNpc,
    excluirNpc
  };
}
