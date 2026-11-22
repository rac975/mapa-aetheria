import { useCallback } from 'react';
import { combatService } from '../../services/combatService';
import { resolverAcaoCombate } from '../../domain/fabula/combatRules';

/**
 * useCombatQuickActions
 * Gerencia modificadores globais de cena e execução de ações rápidas de combate com resolução de regras.
 */
export function useCombatQuickActions({
  isMestre,
  participantes,
  setParticipantes,
  estadoCombate,
  setEstadoCombate,
  relogios,
  setRelogios,
  setAcoesFeed,
  setAlerta,
  jogadorFichaId,
  jogadorNome
}) {
  const atualizarModificadorGlobal = useCallback(async (novosMods) => {
    if (!isMestre) return;
    const combinados = { ...(estadoCombate?.modificadores_globais || {}), ...novosMods };
    setEstadoCombate((prev) => ({ ...prev, modificadores_globais: combinados }));
    await combatService.updateEstadoCombate({ modificadores_globais: combinados });
  }, [isMestre, estadoCombate?.modificadores_globais, setEstadoCombate]);

  const executarAcaoRapida = useCallback(async ({
    acaoCodigo,
    atorId,
    alvoId = null,
    relogioId = null,
    custoPm = 0,
    custoPi = 0,
    custoPf = 0,
    danoAplicado = 0,
    curaAplicada = 0,
    recursoCura = 'pv',
    tipoDano = 'fisico',
    afinidadeAlvo = 'normal',
    condicaoAlvo = null,
    avancoRelogio = 0,
    notaLivre = '',
    marcarTurnoConcluido = true
  }) => {
    const lista = participantes || [];
    const ator = lista.find((p) => String(p.id) === String(atorId));
    const alvo = alvoId ? lista.find((p) => String(p.id) === String(alvoId)) : null;

    if (!isMestre) {
      const ehAtorValido = ator && (
        (jogadorFichaId && String(ator.ficha_id) === jogadorFichaId) ||
        (jogadorNome && ator.nome?.trim().toLowerCase() === jogadorNome?.trim().toLowerCase())
      );
      if (!ehAtorValido) {
        setAlerta({
          isOpen: true,
          type: 'warning',
          title: 'Ação Bloqueada',
          message: 'Você só pode executar ações e rolagens em nome do seu próprio herói.'
        });
        return false;
      }
    }

    const resultado = resolverAcaoCombate({
      acaoCodigo,
      ator,
      alvo,
      custoPm,
      custoPi,
      custoPf,
      danoAplicado,
      curaAplicada,
      recursoCura,
      tipoDano,
      afinidadeAlvo,
      condicaoAlvo,
      avancoRelogio,
      notaLivre,
      marcarTurnoConcluido,
      modificadoresCena: estadoCombate?.modificadores_globais || {}
    });

    if (!resultado.valido) {
      setAlerta({ isOpen: true, type: 'warning', title: 'Ação Não Permitida', message: resultado.erro });
      return false;
    }

    // 1. Atualiza estado e persiste ator
    if (Object.keys(resultado.updatesAtor).length > 0) {
      setParticipantes((prev) => prev.map((p) => (p.id === ator.id ? { ...p, ...resultado.updatesAtor } : p)));
      await combatService.updateParticipante(ator.id, resultado.updatesAtor);

      if (ator.tipo === 'heroi' && ator.ficha_id) {
        await combatService.updateFichaPersonagemFromCombat(ator.ficha_id, resultado.updatesAtor);
      }
    }

    // 2. Persiste alvo
    if (resultado.updatesAlvo && resultado.alvoId && resultado.alvoId !== ator.id) {
      const alvoObj = lista.find((p) => p.id === resultado.alvoId);
      setParticipantes((prev) => prev.map((p) => (p.id === resultado.alvoId ? { ...p, ...resultado.updatesAlvo } : p)));
      await combatService.updateParticipante(resultado.alvoId, resultado.updatesAlvo);

      if (alvoObj?.tipo === 'heroi' && alvoObj.ficha_id) {
        await combatService.updateFichaPersonagemFromCombat(alvoObj.ficha_id, resultado.updatesAlvo);
      }
    }

    // 3. Avança Relógio de Conflito
    if (resultado.deltaRelogio !== 0 && relogioId) {
      const listaRelogios = relogios || [];
      const relogioAlvo = listaRelogios.find((r) => String(r.id) === String(relogioId));
      if (relogioAlvo) {
        const novasFatias = Math.max(0, Math.min(relogioAlvo.fatias_total, (Number(relogioAlvo.fatias_atuais) || 0) + resultado.deltaRelogio));
        setRelogios((prev) => prev.map((r) => (r.id === relogioAlvo.id ? { ...r, fatias_atuais: novasFatias } : r)));
        await combatService.avancarRelogioCombate(relogioAlvo.id, novasFatias);
      }
    }

    // 4. Feed de ações
    if (resultado.logEntry) {
      const { data } = await combatService.registrarAcaoCombate(resultado.logEntry);
      if (data) {
        setAcoesFeed((prev) => [data, ...prev].slice(0, 30));
      }
    }

    return true;
  }, [participantes, estadoCombate?.modificadores_globais, relogios, isMestre, jogadorFichaId, jogadorNome, setAlerta, setParticipantes, setRelogios, setAcoesFeed]);

  const limparHistoricoAcoes = useCallback(async () => {
    if (!isMestre) return;
    setAcoesFeed([]);
    await combatService.limparAcoesCombate();
  }, [isMestre, setAcoesFeed]);

  return {
    atualizarModificadorGlobal,
    executarAcaoRapida,
    limparHistoricoAcoes
  };
}
