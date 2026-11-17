import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { UndoToast } from '../components/ui';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toastState, setToastState] = useState({
    isOpen: false,
    message: null,
    duration: 5000,
    progressoKey: 0
  });

  const pendingActionRef = useRef(null);

  // Executa e confirma ação pendente (commit imediato)
  const commitPendingAction = useCallback(async () => {
    if (pendingActionRef.current) {
      const { timerId, commitFn } = pendingActionRef.current;
      if (timerId) clearTimeout(timerId);
      pendingActionRef.current = null;
      if (commitFn) {
        try {
          await commitFn();
        } catch (err) {
          console.error('[ToastContext] Erro ao executar commit permanente:', err);
        }
      }
    }
  }, []);

  // Desfaz a exclusão pendente (rollback)
  const handleUndo = useCallback(() => {
    if (pendingActionRef.current) {
      const { timerId, undoFn } = pendingActionRef.current;
      if (timerId) clearTimeout(timerId);
      pendingActionRef.current = null;
      if (undoFn) {
        try {
          undoFn();
        } catch (err) {
          console.error('[ToastContext] Erro ao executar rollback de exclusão:', err);
        }
      }
    }
    setToastState(prev => ({ ...prev, isOpen: false }));
  }, []);

  /**
   * Inicia exclusão fria exibindo barra regressiva com botão Desfazer.
   * Só efetiva a exclusão (onConfirm) se o tempo expirar sem clique em Desfazer.
   */
  const showUndoToast = useCallback(({ message, onConfirm, onUndo, duration = 5000 }) => {
    // Se havia uma exclusão anterior pendente, efetiva-a imediatamente antes de abrir a nova
    commitPendingAction();

    const progressoKey = Date.now();

    const timerId = setTimeout(async () => {
      setToastState(prev => ({ ...prev, isOpen: false }));
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      if (action?.commitFn) {
        try {
          await action.commitFn();
        } catch (err) {
          console.error('[ToastContext] Erro ao executar exclusão após timeout:', err);
        }
      }
    }, duration);

    pendingActionRef.current = {
      timerId,
      commitFn: onConfirm,
      undoFn: onUndo
    };

    setToastState({
      isOpen: true,
      message,
      duration,
      progressoKey
    });
  }, [commitPendingAction]);

  /**
   * Helper conveniente para fluxo de Deletar Frio completo:
   * Remove imediatamente do estado local (onRemove),
   * mostra UndoToast e, caso expire, comita no Supabase (onCommit);
   * se o usuário clicar em Desfazer, restaura o estado (onRollback).
   */
  const coldDelete = useCallback(({ item, message, onRemove, onCommit, onRollback, duration = 5000 }) => {
    if (onRemove) onRemove(item);

    const defaultMsg = (
      <>
        <strong>{item?.nome || item?.titulo || 'Item'}</strong> foi removido.
      </>
    );

    showUndoToast({
      message: message || defaultMsg,
      duration,
      onConfirm: async () => {
        if (onCommit) await onCommit(item);
      },
      onUndo: () => {
        if (onRollback) onRollback(item);
      }
    });
  }, [showUndoToast]);

  // Garante que exclusões pendentes sejam salvas ao desmontar
  useEffect(() => {
    return () => {
      if (pendingActionRef.current?.commitFn) {
        pendingActionRef.current.commitFn();
      }
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showUndoToast, coldDelete, commitPendingAction }}>
      {children}
      <UndoToast
        mostrar={toastState.isOpen}
        mensagem={toastState.message}
        progressoKey={toastState.progressoKey}
        duracaoMs={toastState.duration}
        onUndo={handleUndo}
      />
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider');
  }
  return context;
}
export default ToastContext;
