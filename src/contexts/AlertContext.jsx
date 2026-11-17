import { useState, useCallback } from 'react';
import CustomAlert from '../components/CustomAlert/CustomAlert';
import { AlertContext } from './alertContextDef';

function inferirTipoETitulo(texto) {
  const str = String(texto || '');
  if (str.includes('❌') || /erro|inválid|insuficient|falha|bloquead/i.test(str)) {
    return { type: 'error', title: 'Erro' };
  }
  if (str.includes('✅') || str.includes('✨') || /sucesso|concluíd|adquirido|salvo|atualizada/i.test(str)) {
    return { type: 'success', title: 'Sucesso' };
  }
  return { type: 'alert', title: 'Aviso' };
}

export function AlertProvider({ children }) {
  const [alerta, setAlerta] = useState({
    isOpen: false,
    title: 'Aviso',
    message: '',
    type: 'alert',
    onConfirm: null,
    confirmText: undefined,
    cancelText: undefined
  });

  const fecharAlerta = useCallback(() => {
    setAlerta((prev) => ({ ...prev, isOpen: false, onConfirm: null }));
  }, []);

  const showAlert = useCallback((arg1, titleOverride, typeOverride) => {
    if (arg1 && typeof arg1 === 'object' && !Array.isArray(arg1)) {
      const inferido = inferirTipoETitulo(arg1.message);
      setAlerta({
        isOpen: true,
        title: arg1.title || inferido.title,
        message: arg1.message || '',
        type: arg1.type || inferido.type,
        onConfirm: arg1.onConfirm || null,
        confirmText: arg1.confirmText,
        cancelText: arg1.cancelText
      });
      return;
    }

    const inferido = inferirTipoETitulo(arg1);
    setAlerta({
      isOpen: true,
      title: titleOverride || inferido.title,
      message: String(arg1 || ''),
      type: typeOverride || inferido.type,
      onConfirm: null,
      confirmText: undefined,
      cancelText: undefined
    });
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, fecharAlerta }}>
      {children}
      <CustomAlert
        isOpen={alerta.isOpen}
        title={alerta.title}
        message={alerta.message}
        type={alerta.type}
        onConfirm={alerta.onConfirm}
        confirmText={alerta.confirmText}
        cancelText={alerta.cancelText}
        onClose={fecharAlerta}
      />
    </AlertContext.Provider>
  );
}
