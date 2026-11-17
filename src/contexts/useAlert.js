import { useContext } from 'react';
import { AlertContext } from './alertContextDef';

export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) {
    throw new Error('useAlert deve ser usado dentro de um AlertProvider');
  }
  return ctx;
}
