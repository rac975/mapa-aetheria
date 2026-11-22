import { useState, useRef, useCallback } from 'react';

/**
 * Hook de drag-and-drop ergonômico para a fila unificada da Ordem de Combate.
 * Suporta itens de alturas diferentes (cards de combatentes e tokens de ação compactos)
 * com cálculo geométrico contínuo e histerese anti-salto.
 */
export function useCombatantDrag({ onReorder, totalItems }) {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [targetIndex, setTargetIndex] = useState(null);

  const activePointerId = useRef(null);
  const draggedIdxRef = useRef(null);
  const targetIdxRef = useRef(null);
  const listContainerRef = useRef(null);

  const handlePointerDown = useCallback((e, index) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.stopPropagation();

    const handle = e.currentTarget;
    try {
      handle.setPointerCapture(e.pointerId);
    } catch (_err) {
      void _err;
    }

    const itemEl = handle.closest('[data-combatant-index]');
    listContainerRef.current = itemEl?.parentElement || null;
    activePointerId.current = e.pointerId;
    draggedIdxRef.current = index;
    targetIdxRef.current = index;

    setDraggedIndex(index);
    setTargetIndex(index);
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (activePointerId.current === null) return;
    e.preventDefault();

    const root = listContainerRef.current || document;
    const nodes = Array.from(root.querySelectorAll('[data-combatant-index]'));
    if (nodes.length === 0) return;

    const clientY = e.clientY;
    const currentTarget = targetIdxRef.current;

    // Histerese anti-oscilação: se o ponteiro continua dentro do item alvo atual (margem 4px), mantém
    if (currentTarget !== null) {
      const currentNode = nodes.find(
        (n) => Number(n.getAttribute('data-combatant-index')) === currentTarget
      );
      if (currentNode) {
        const r = currentNode.getBoundingClientRect();
        if (clientY >= r.top + 4 && clientY <= r.bottom - 4) {
          return;
        }
      }
    }

    let chosenIdx = null;
    let menorDistancia = Infinity;

    for (const node of nodes) {
      const idx = Number(node.getAttribute('data-combatant-index'));
      if (Number.isNaN(idx) || idx < 0 || idx >= totalItems) continue;

      const rect = node.getBoundingClientRect();
      if (clientY >= rect.top && clientY <= rect.bottom) {
        chosenIdx = idx;
        break;
      }

      const centroY = rect.top + rect.height / 2;
      const dist = Math.abs(clientY - centroY);
      if (dist < menorDistancia) {
        menorDistancia = dist;
        chosenIdx = idx;
      }
    }

    if (chosenIdx !== null && chosenIdx !== targetIdxRef.current) {
      targetIdxRef.current = chosenIdx;
      setTargetIndex(chosenIdx);
    }
  }, [totalItems]);

  const finalizarDrag = useCallback((e, cancelar = false) => {
    if (activePointerId.current === null) return;
    if (e?.pointerId !== undefined && activePointerId.current !== e.pointerId) return;

    try {
      e?.currentTarget?.releasePointerCapture(e.pointerId);
    } catch (_err) {
      void _err;
    }

    const fromIdx = draggedIdxRef.current;
    const toIdx = targetIdxRef.current;

    activePointerId.current = null;
    draggedIdxRef.current = null;
    targetIdxRef.current = null;
    listContainerRef.current = null;

    setDraggedIndex(null);
    setTargetIndex(null);

    if (!cancelar && fromIdx !== null && toIdx !== null && fromIdx !== toIdx && onReorder) {
      onReorder({ fromIndex: fromIdx, toIndex: toIdx });
    }
  }, [onReorder]);

  const handlePointerUp = useCallback((e) => {
    finalizarDrag(e, false);
  }, [finalizarDrag]);

  const handlePointerCancel = useCallback((e) => {
    finalizarDrag(e, true);
  }, [finalizarDrag]);

  return {
    draggedIndex,
    targetIndex,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel
  };
}
