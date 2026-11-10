import { useState, useRef, useCallback } from 'react';

/**
 * Hook reutilizável para "Delete Frio" com Undo (Desfazer).
 * @param {Function} onDeletePermanente - Função async que executa o delete definitivo no Supabase/Banco
 * @param {Function} onRestoreLocal - Função que restaura o item no estado local da tela
 */
export function useUndoDelete(onDeletePermanente, onRestoreLocal) {
  const [itemParaExcluir, setItemParaExcluir] = useState(null);
  const [mostrarToast, setMostrarToast] = useState(false);
  const timeoutRef = useRef(null);

  const iniciarExclusao = useCallback((item) => {
    // Limpa timer anterior se houver
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setItemParaExcluir(item);
    setMostrarToast(true);

    // Agenda a exclusão definitiva para daqui a 5 segundos
    timeoutRef.current = setTimeout(async () => {
      if (item) {
        await onDeletePermanente(item.id);
      }
      setMostrarToast(false);
      setItemParaExcluir(null);
    }, 5000);
  }, [onDeletePermanente]);

  const desfazerExclusao = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (itemParaExcluir) {
      onRestoreLocal(itemParaExcluir);
    }
    setMostrarToast(false);
    setItemParaExcluir(null);
  }, [itemParaExcluir, onRestoreLocal]);

  return {
    mostrarToast,
    itemParaExcluir,
    iniciarExclusao,
    desfazerExclusao
  };
}