import { useState, useRef, useCallback } from 'react';

export function useCombatantDrag({ onReorder, totalItems }) {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [targetIndex, setTargetIndex] = useState(null);
  const activePointerId = useRef(null);

  const handlePointerDown = useCallback((e, index) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.stopPropagation();

    const handle = e.currentTarget;
    try {
      handle.setPointerCapture(e.pointerId);
    } catch (_err) {
      void _err;
    }
    activePointerId.current = e.pointerId;

    setDraggedIndex(index);
    setTargetIndex(index);
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (activePointerId.current === null) return;
    e.preventDefault();

    const el = document.elementFromPoint(e.clientX, e.clientY);
    const card = el?.closest('[data-combatant-index]');
    if (card) {
      const idx = Number(card.getAttribute('data-combatant-index'));
      if (!isNaN(idx) && idx >= 0 && idx < totalItems) {
        setTargetIndex(idx);
      }
    }
  }, [totalItems]);

  const handlePointerUp = useCallback((e) => {
    if (activePointerId.current !== e.pointerId) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_err) {
      void _err;
    }
    activePointerId.current = null;

    setDraggedIndex((fromIdx) => {
      setTargetIndex((toIdx) => {
        if (fromIdx !== null && toIdx !== null && fromIdx !== toIdx && onReorder) {
          onReorder(fromIdx, toIdx);
        }
        return null;
      });
      return null;
    });
  }, [onReorder]);

  const handlePointerCancel = useCallback((e) => {
    if (activePointerId.current === e.pointerId) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (_err) {
        void _err;
      }
      activePointerId.current = null;
      setDraggedIndex(null);
      setTargetIndex(null);
    }
  }, []);

  return {
    draggedIndex,
    targetIndex,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel
  };
}
