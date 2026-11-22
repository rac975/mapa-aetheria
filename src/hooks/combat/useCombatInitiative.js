import { useCallback, useMemo } from 'react';
import { combatInitiativeService } from '../../services/combatInitiativeService';
import { combatService } from '../../services/combatService';
import {
  calcularContadoresAcoesRodada,
  rolarIniciativaCombate,
  extrairIniciativaFixaInimigo
} from '../../domain/fabula/combatInitiativeRules';
import {
  construirFilaUnificadaCombate,
  moverItemFilaUnificada
} from '../../domain/fabula/combatQueueRules';

/**
 * useCombatInitiative
 * Gerencia iniciativa de heróis, iniciativa fixa de inimigos, fila unificada com tokens de ação móveis
 * e sincronização de slots de múltiplas ações.
 */
export function useCombatInitiative({
  isMestre,
  participantes,
  setParticipantes,
  estadoCombate,
  setEstadoCombate,
  setAcoesFeed,
  setAlerta,
  obterPerfilRolagem,
  jogadorFichaId,
  jogadorNome,
  onDispararOportunidade
}) {
  const contadoresAcoes = useMemo(() => {
    return calcularContadoresAcoesRodada(participantes || []);
  }, [participantes]);

  const filaUnificada = useMemo(() => {
    const ordemSalva = estadoCombate?.modificadores_globais?.ordem_fila_tokens || [];
    return construirFilaUnificadaCombate(participantes || [], ordemSalva);
  }, [participantes, estadoCombate?.modificadores_globais?.ordem_fila_tokens]);

  const moverItemFila = useCallback(async (indexOuPayload, direcao = 0) => {
    if (!isMestre) return;
    const {
      novaOrdemChaves,
      participantesReordenados,
      mudouOrdemCards
    } = moverItemFilaUnificada(filaUnificada, indexOuPayload, direcao);

    const modsGlobais = {
      ...(estadoCombate?.modificadores_globais || {}),
      ordem_fila_tokens: novaOrdemChaves
    };
    setEstadoCombate((prev) => ({ ...prev, modificadores_globais: modsGlobais }));

    if (mudouOrdemCards) {
      setParticipantes(participantesReordenados);
      await combatService.salvarNovaOrdem(participantesReordenados);
    }
    await combatService.updateEstadoCombate({ modificadores_globais: modsGlobais });
  }, [isMestre, filaUnificada, estadoCombate?.modificadores_globais, setEstadoCombate, setParticipantes]);

  const atualizarIniciativa = useCallback(async (id, valorIniciativa) => {
    const lista = participantes || [];
    const participante = lista.find((p) => p.id === id);
    const ehMeuPersonagem = !isMestre && participante && (
      (jogadorFichaId && String(participante.ficha_id) === jogadorFichaId) ||
      (jogadorNome && participante.nome?.trim().toLowerCase() === jogadorNome?.trim().toLowerCase())
    );
    if (!isMestre && !ehMeuPersonagem) return false;

    const valNumerico = Math.floor(Number(valorIniciativa)) || 0;
    const modsAtuais = participante?.modificadores && typeof participante.modificadores === 'object'
      ? participante.modificadores
      : {};

    setParticipantes((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              iniciativa: valNumerico,
              modificadores: { ...item.modificadores, iniciativa: valNumerico }
            }
          : item
      )
    );

    await combatInitiativeService.atualizarIniciativa(id, valNumerico, modsAtuais);
    return true;
  }, [isMestre, participantes, jogadorFichaId, jogadorNome, setParticipantes]);

  const rolarIniciativaCombatente = useCallback(async (combatente) => {
    if (!combatente) return null;

    // Regra oficial: Inimigos NÃO rolam iniciativa; utilizam o valor fixo da ficha
    if (combatente.tipo !== 'heroi') {
      if (!isMestre) return null;
      const perfilNpc = obterPerfilRolagem ? obterPerfilRolagem(combatente) : null;
      const iniFixa = extrairIniciativaFixaInimigo(combatente, perfilNpc?.npc, perfilNpc);
      await atualizarIniciativa(combatente.id, iniFixa);
      return iniFixa;
    }

    const ehMeuPersonagem = !isMestre && (
      (jogadorFichaId && String(combatente.ficha_id) === jogadorFichaId) ||
      (jogadorNome && combatente.nome?.trim().toLowerCase() === jogadorNome?.trim().toLowerCase())
    );
    if (!isMestre && !ehMeuPersonagem) {
      setAlerta({
        isOpen: true,
        type: 'warning',
        title: 'Rolagem Não Permitida',
        message: 'Você só pode rolar iniciativa para o seu próprio herói.'
      });
      return null;
    }

    const perfil = obterPerfilRolagem ? obterPerfilRolagem(combatente) : null;
    const resultado = rolarIniciativaCombate({ combatente, perfil });
    const valorRolado = Number(resultado.total) || 0;

    await atualizarIniciativa(combatente.id, valorRolado);

    if (resultado.logEntry) {
      const { data } = await combatService.registrarAcaoCombate(resultado.logEntry);
      if (data) {
        setAcoesFeed((prev) => [data, ...prev].slice(0, 30));
      } else {
        setAcoesFeed((prev) => [{ id: `local_${Date.now()}`, ...resultado.logEntry }, ...prev].slice(0, 30));
      }
    }

    if ((resultado.isCritico || resultado.isFumble) && onDispararOportunidade) {
      await onDispararOportunidade({
        combatente,
        resultadoRolagem: resultado,
        origemAcao: 'Teste de Iniciativa'
      });
    } else {
      const modStr = perfil?.iniciativaMod
        ? (perfil.iniciativaMod > 0 ? `+ ${perfil.iniciativaMod}` : `- ${Math.abs(perfil.iniciativaMod)}`)
        : '+ 0';
      setAlerta({
        isOpen: true,
        type: 'info',
        title: `⚡ Iniciativa: ${combatente.nome} (${valorRolado})`,
        message: `${resultado.detalhes || ''} — Fórmula: [DES + AST] ${modStr} (Mod. da Ficha)`
      });
    }

    return valorRolado;
  }, [isMestre, jogadorFichaId, jogadorNome, obterPerfilRolagem, atualizarIniciativa, setAcoesFeed, setAlerta, onDispararOportunidade]);

  const ajustarAcaoSlotInimigo = useCallback(async (pOuId, slotIndex) => {
    if (!isMestre) return;
    const p = typeof pOuId === 'object' && pOuId !== null
      ? pOuId
      : (participantes || []).find((item) => String(item.id) === String(pOuId));
    if (!p || p.tipo === 'heroi') return;

    const totalAcoes = Math.max(1, Number(p.acoes_por_turno) || 1);
    const modsAtuais = p.modificadores && typeof p.modificadores === 'object' ? p.modificadores : {};
    const realizadasAtuais = Math.max(0, Number(modsAtuais.acoes_realizadas_rodada) || 0);

    let novasRealizadas;
    if (slotIndex === 0) {
      novasRealizadas = 0;
    } else if (slotIndex !== undefined && slotIndex !== null) {
      novasRealizadas = slotIndex <= realizadasAtuais ? slotIndex - 1 : slotIndex;
    } else {
      novasRealizadas = realizadasAtuais + 1;
    }
    novasRealizadas = Math.max(0, Math.min(totalAcoes, novasRealizadas));
    const concluiuTodas = novasRealizadas >= totalAcoes;

    const updates = {
      agiu: concluiuTodas,
      turno_atual: concluiuTodas ? false : p.turno_atual,
      modificadores: {
        ...modsAtuais,
        acoes_realizadas_rodada: novasRealizadas
      }
    };

    setParticipantes((prev) => prev.map((item) => (item.id === p.id ? { ...item, ...updates } : item)));
    await combatService.updateParticipante(p.id, updates);
  }, [isMestre, participantes, setParticipantes]);

  return {
    contadoresAcoes,
    filaUnificada,
    moverItemFila,
    atualizarIniciativa,
    rolarIniciativaCombatente,
    ajustarAcaoSlotInimigo
  };
}
