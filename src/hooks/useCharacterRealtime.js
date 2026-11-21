import { useEffect } from 'react';
import { fichaService } from '../services/fichaService';
import { calcularModificadoresCondicoes } from './useCharacterStats';

/**
 * Hook customizado para gerenciar todas as assinaturas em tempo real do Supabase
 * vinculadas a uma ficha aberta, garantindo limpeza adequada no unmount.
 */
export function useCharacterRealtime(fichaId, {
  setFicha,
  setItensInventario,
  setCondicoesAtivas,
  setModificadoresTemporarios,
  setClasses
} = {}) {
  useEffect(() => {
    if (!fichaId) return;

    let canalFicha = null;
    let canalEquip = null;
    let canalCondicoes = null;
    let canalClasses = null;

    try {
      if (setFicha) {
        canalFicha = fichaService.subscribeFichaById(fichaId, (payload) => {
          if (payload?.eventType === 'UPDATE' && payload?.new) {
            setFicha((prev) => (prev ? { ...prev, ...payload.new } : payload.new));
            if (payload.new.condicoes !== undefined && setCondicoesAtivas) {
              const novasConds = Array.isArray(payload.new.condicoes) ? payload.new.condicoes : [];
              setCondicoesAtivas(novasConds);
              if (setModificadoresTemporarios) {
                setModificadoresTemporarios(calcularModificadoresCondicoes(novasConds));
              }
            }
          }
        });
      }

      if (setItensInventario) {
        canalEquip = fichaService.subscribeItens(fichaId, async () => {
          try {
            const novosItens = await fichaService.getItensByFichaId(fichaId);
            setItensInventario(novosItens);
          } catch (err) {
            console.error('Erro ao atualizar itens em tempo real:', err);
          }
        });
      }

      if (setCondicoesAtivas && setModificadoresTemporarios) {
        canalCondicoes = fichaService.subscribeCondicoesCombate(fichaId, (payload) => {
          const novasCondicoes = payload?.new?.condicoes || [];
          setCondicoesAtivas(novasCondicoes);
          setModificadoresTemporarios(calcularModificadoresCondicoes(novasCondicoes));
        });
      }

      if (setClasses) {
        canalClasses = fichaService.subscribeClasses(fichaId, async () => {
          try {
            const novasClasses = await fichaService.getClassesByFichaId(fichaId);
            setClasses(novasClasses);
          } catch (err) {
            console.error('Erro ao atualizar classes em tempo real:', err);
          }
        });
      }
    } catch (subErr) {
      console.error('Erro ao registrar subscriptions da ficha:', subErr);
    }

    return () => {
      if (canalFicha) fichaService.removeChannel(canalFicha);
      if (canalEquip) fichaService.removeChannel(canalEquip);
      if (canalCondicoes) fichaService.removeChannel(canalCondicoes);
      if (canalClasses) fichaService.removeChannel(canalClasses);
    };
  }, [fichaId, setFicha, setItensInventario, setCondicoesAtivas, setModificadoresTemporarios, setClasses]);
}
