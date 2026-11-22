import { useCallback } from 'react';
import { combatService } from '../../services/combatService';
import {
  alternarTurno,
  alternarCondicao,
  reordenarParticipantes
} from '../../domain/fabula/combatRules';

/**
 * useCombatTurnManagement
 * Gerencia a alternância de turnos, nova rodada, restauração da cena, condições e reordenação.
 */
export function useCombatTurnManagement({
  isMestre,
  participantes,
  setParticipantes,
  estadoCombate,
  setEstadoCombate,
  jogadorFichaId,
  jogadorNome
}) {
  const toggleTurno = useCallback(async (id, statusAtual) => {
    const lista = participantes || [];
    const participante = lista.find((p) => p.id === id);
    const ehMeuPersonagem = !isMestre && participante && (
      (jogadorFichaId && String(participante.ficha_id) === jogadorFichaId) ||
      (jogadorNome && participante.nome?.trim().toLowerCase() === jogadorNome?.trim().toLowerCase())
    );
    if (!isMestre && !ehMeuPersonagem) return;

    const novoStatus = alternarTurno(statusAtual);
    setParticipantes((prev) => prev.map((p) => (p.id === id ? { ...p, agiu: novoStatus, turno_atual: false } : p)));
    await combatService.updateParticipante(id, { agiu: novoStatus, turno_atual: false });
  }, [isMestre, participantes, jogadorFichaId, jogadorNome, setParticipantes]);

  const ativarTurnoParticipante = useCallback(async (participante) => {
    if (!participante?.id) return;
    const ehMeuPersonagem = !isMestre && (
      (jogadorFichaId && String(participante.ficha_id) === jogadorFichaId) ||
      (jogadorNome && participante.nome?.trim().toLowerCase() === jogadorNome?.trim().toLowerCase())
    );
    if (!isMestre && !ehMeuPersonagem) return;

    const lista = participantes || [];
    setParticipantes((prev) =>
      prev.map((p) =>
        p.id === participante.id
          ? { ...p, turno_atual: true, guardando: false, protegendo_id: null }
          : { ...p, turno_atual: false }
      )
    );
    await combatService.definirTurnoAtivo(participante.id, lista.map((p) => p.id));
    if (participante.guardando || participante.protegendo_id) {
      await combatService.updateParticipante(participante.id, { guardando: false, protegendo_id: null });
    }
  }, [isMestre, participantes, jogadorFichaId, jogadorNome, setParticipantes]);

  const resetRodada = useCallback(async () => {
    if (!isMestre) return;
    const lista = participantes || [];
    const novaRodada = (Number(estadoCombate?.rodada) || 1) + 1;
    setParticipantes((prev) =>
      prev.map((p) => ({
        ...p,
        agiu: false,
        guardando: false,
        protegendo_id: null,
        turno_atual: false,
        modificadores: {
          ...(p.modificadores && typeof p.modificadores === 'object' ? p.modificadores : {}),
          acoes_realizadas_rodada: 0
        }
      }))
    );
    setEstadoCombate((prev) => ({ ...prev, rodada: novaRodada }));
    await combatService.resetRodada(lista, novaRodada);
    await combatService.registrarAcaoCombate({
      autor_nome: 'Mestre',
      autor_tipo: 'sistema',
      acao_codigo: 'NOVA_RODADA',
      acao_titulo: `Rodada ${novaRodada} Iniciada`,
      detalhes: 'Todos os combatentes recuperaram seus turnos e posturas de Guarda encerraram.',
      metadata: { rodada: novaRodada }
    });
  }, [isMestre, participantes, estadoCombate?.rodada, setParticipantes, setEstadoCombate]);

  const restaurarTudoCena = useCallback(async () => {
    if (!isMestre) return;
    const lista = participantes || [];
    setParticipantes((prev) =>
      prev.map((p) => ({
        ...p,
        agiu: false,
        guardando: false,
        protegendo_id: null,
        turno_atual: false,
        dano_acumulado: 0,
        condicoes: [],
        modificadores: {},
        hp_atual: p.hp_max,
        mp_atual: p.mp_max
      }))
    );
    setEstadoCombate((prev) => ({ ...prev, rodada: 1, modificadores_globais: {} }));
    await combatService.restaurarCena(lista);

    for (const p of lista) {
      if (p.tipo === 'heroi' && p.ficha_id) {
        await combatService.updateFichaPersonagemFromCombat(p.ficha_id, {
          hp_atual: p.hp_max,
          mp_atual: p.mp_max,
          condicoes: []
        });
      }
    }

    await combatService.registrarAcaoCombate({
      autor_nome: 'Mestre',
      autor_tipo: 'sistema',
      acao_codigo: 'RESTAURAR_CENA',
      acao_titulo: 'Cena Restaurada',
      detalhes: 'PV, PM, condições, modificadores e contagem de rodadas foram reiniciados.',
      metadata: {}
    });
  }, [isMestre, participantes, setParticipantes, setEstadoCombate]);

  const toggleCondicao = useCallback(async (p, condicaoId) => {
    const ehMeuPersonagem = !isMestre && (
      (jogadorFichaId && String(p.ficha_id) === jogadorFichaId) ||
      (jogadorNome && p.nome?.trim().toLowerCase() === jogadorNome?.trim().toLowerCase())
    );
    if (!isMestre && !ehMeuPersonagem) return;

    const novasCondicoes = alternarCondicao(p.condicoes || [], condicaoId);
    setParticipantes((prev) => prev.map((item) => (item.id === p.id ? { ...item, condicoes: novasCondicoes } : item)));
    await combatService.updateParticipante(p.id, { condicoes: novasCondicoes });

    if (p.tipo === 'heroi' && p.ficha_id) {
      await combatService.updateFichaPersonagemFromCombat(p.ficha_id, { condicoes: novasCondicoes });
    }
  }, [isMestre, jogadorFichaId, jogadorNome, setParticipantes]);

  const moverItem = useCallback(async (index, direcao) => {
    if (!isMestre) return;
    const lista = participantes || [];
    const novaLista = reordenarParticipantes(lista, index, direcao);
    setParticipantes(novaLista);
    await combatService.salvarNovaOrdem(novaLista);
  }, [isMestre, participantes, setParticipantes]);

  return {
    toggleTurno,
    ativarTurnoParticipante,
    resetRodada,
    restaurarTudoCena,
    toggleCondicao,
    moverItem
  };
}
