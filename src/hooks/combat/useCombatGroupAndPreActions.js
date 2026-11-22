import { useState, useCallback } from 'react';
import { combatService } from '../../services/combatService';
import { combatInitiativeService } from '../../services/combatInitiativeService';
import { extrairIniciativaFixaInimigo } from '../../domain/fabula/combatInitiativeRules';
import { gerarOrdemIntercaladaIniciativa } from '../../domain/fabula/combatQueueRules';
import { resolverAcaoPrePrimeiraRodada } from '../../domain/fabula/combatPreConflictRules';

/**
 * useCombatGroupAndPreActions
 * Coordena o Teste em Grupo de Iniciativa ([DES + AST]) e as Ações Pré-1ª Rodada (Alta Velocidade).
 */
export function useCombatGroupAndPreActions({
  isMestre,
  participantes,
  setParticipantes,
  npcsDisponiveis,
  estadoCombate,
  setEstadoCombate,
  relogios,
  setRelogios,
  setAcoesFeed,
  setAlerta,
  obterPerfilRolagem,
  jogadorFichaId,
  jogadorNome,
  dispararOportunidadeCombate
}) {
  const [modalGrupoIniAberto, setModalGrupoIniAberto] = useState(false);

  const abrirModalGrupoIniciativa = useCallback(() => {
    setModalGrupoIniAberto(true);
  }, []);

  const fecharModalGrupoIniciativa = useCallback(() => {
    setModalGrupoIniAberto(false);
  }, []);

  const aplicarResultadoTesteGrupoIniciativa = useCallback(async (resultadoGrupo) => {
    if (!resultadoGrupo) return;
    const lista = participantes || [];
    const listaNpcs = npcsDisponiveis || [];

    const atualizados = lista.map((p) => {
      if (p.tipo === 'heroi') {
        const val = Number(resultadoGrupo.totalLider) || 0;
        return {
          ...p,
          iniciativa: val,
          modificadores: { ...(p.modificadores || {}), iniciativa: val }
        };
      }
      const npcId = p.modificadores?.npc_id;
      const npcFicha = listaNpcs.find(
        (n) => (npcId && String(n.id) === String(npcId)) || n.nome?.toLowerCase() === p.nome?.toLowerCase()
      ) || null;
      const iniFixa = extrairIniciativaFixaInimigo(p, npcFicha);
      return {
        ...p,
        iniciativa: iniFixa,
        modificadores: { ...(p.modificadores || {}), iniciativa: iniFixa }
      };
    });

    const { participantesOrdenados, ordemChavesFila } = gerarOrdemIntercaladaIniciativa(
      atualizados,
      resultadoGrupo.heroisVenceram
    );

    const comPrimeiroDestacado = participantesOrdenados.map((p, idx) => ({
      ...p,
      turno_atual: idx === 0
    }));

    setParticipantes(comPrimeiroDestacado);
    setModalGrupoIniAberto(false);

    const novosModsGlobais = {
      ...(estadoCombate?.modificadores_globais || {}),
      ordem_fila_tokens: ordemChavesFila,
      vencedor_iniciativa: resultadoGrupo.heroisVenceram ? 'herois' : 'inimigos',
      nd_iniciativa_cena: resultadoGrupo.ndInimigos,
      total_grupo_iniciativa: resultadoGrupo.totalLider
    };
    setEstadoCombate((prev) => ({ ...prev, modificadores_globais: novosModsGlobais }));

    for (const p of comPrimeiroDestacado) {
      await combatInitiativeService.atualizarIniciativa(p.id, p.iniciativa, p.modificadores);
    }
    await combatInitiativeService.salvarNovaOrdem(comPrimeiroDestacado);
    if (comPrimeiroDestacado[0]?.id) {
      await combatService.definirTurnoAtivo(
        comPrimeiroDestacado[0].id,
        comPrimeiroDestacado.map((p) => p.id)
      );
    }
    await combatService.updateEstadoCombate({ modificadores_globais: novosModsGlobais });

    if (resultadoGrupo.logEntry) {
      const { data } = await combatService.registrarAcaoCombate(resultadoGrupo.logEntry);
      if (data) {
        setAcoesFeed((prev) => [data, ...prev].slice(0, 30));
      } else {
        setAcoesFeed((prev) => [{ id: `local_${Date.now()}`, ...resultadoGrupo.logEntry }, ...prev].slice(0, 30));
      }
    }

    if ((resultadoGrupo.isCritico || resultadoGrupo.isFumble) && dispararOportunidadeCombate) {
      const liderObj = comPrimeiroDestacado.find((p) => String(p.id) === String(resultadoGrupo.liderId)) || {
        id: resultadoGrupo.liderId,
        nome: resultadoGrupo.liderNome,
        tipo: 'heroi'
      };
      await dispararOportunidadeCombate({
        combatente: liderObj,
        resultadoRolagem: resultadoGrupo.rolagemLider,
        origemAcao: 'Teste em Grupo de Iniciativa'
      });
    }
  }, [participantes, npcsDisponiveis, estadoCombate?.modificadores_globais, setParticipantes, setEstadoCombate, setAcoesFeed, dispararOportunidadeCombate]);

  const executarAcaoPreRodada = useCallback(async ({
    heroiId,
    tipoAcaoPre = 'ATAQUE_LIVRE',
    np = 1,
    alvoId = null,
    relogioId = null,
    armaIdx = 0,
    attr1 = 'des',
    attr2 = 'ast',
    condicaoId = 'lento'
  }) => {
    const lista = participantes || [];
    const heroi = lista.find((p) => String(p.id) === String(heroiId));
    const alvo = alvoId ? lista.find((p) => String(p.id) === String(alvoId)) : null;

    if (!heroi) return false;
    const ehMeu = !isMestre && (
      (jogadorFichaId && String(heroi.ficha_id) === jogadorFichaId) ||
      (jogadorNome && heroi.nome?.trim().toLowerCase() === jogadorNome?.trim().toLowerCase())
    );
    if (!isMestre && !ehMeu) {
      setAlerta({ isOpen: true, type: 'warning', title: 'Ação Não Permitida', message: 'Você só pode executar ações pré-rodada com seu próprio herói.' });
      return false;
    }

    const perfilHeroi = obterPerfilRolagem ? obterPerfilRolagem(heroi) : null;
    const armaObj = perfilHeroi?.armas?.[armaIdx] || perfilHeroi?.armas?.[0] || null;

    const res = resolverAcaoPrePrimeiraRodada({
      heroi, perfilHeroi, tipoAcaoPre, np, alvo, armaObj, attr1, attr2, condicaoId
    });

    if (!res.valido) {
      setAlerta({ isOpen: true, type: 'warning', title: 'Alta Velocidade / Pré-Rodada', message: res.erro });
      return false;
    }

    setParticipantes((prev) => prev.map((p) => (p.id === heroi.id ? { ...p, ...res.updatesHeroi } : p)));
    await combatService.updateParticipante(heroi.id, res.updatesHeroi);
    if (heroi.ficha_id) {
      await combatService.updateRecursoFicha(heroi.ficha_id, 'mp_atual', res.updatesHeroi.mp_atual);
    }

    if (res.updatesAlvo && res.alvoId) {
      setParticipantes((prev) => prev.map((p) => (p.id === res.alvoId ? { ...p, ...res.updatesAlvo } : p)));
      await combatService.updateParticipante(res.alvoId, res.updatesAlvo);
    }

    if (res.deltaRelogio > 0 && relogioId) {
      const rel = (relogios || []).find((r) => String(r.id) === String(relogioId));
      if (rel) {
        const novas = Math.min(rel.fatias_total, (Number(rel.fatias_atuais) || 0) + res.deltaRelogio);
        setRelogios((prev) => prev.map((r) => (r.id === rel.id ? { ...r, fatias_atuais: novas } : r)));
        await combatService.avancarRelogioCombate(rel.id, novas);
      }
    }

    if (res.logEntry) {
      const { data } = await combatService.registrarAcaoCombate(res.logEntry);
      if (data) setAcoesFeed((prev) => [data, ...prev].slice(0, 30));
    }

    if ((res.resultadoRolagem?.isCritico || res.resultadoRolagem?.isFumble) && dispararOportunidadeCombate) {
      await dispararOportunidadeCombate({
        combatente: heroi,
        resultadoRolagem: res.resultadoRolagem,
        origemAcao: res.logEntry?.acao_titulo || 'Ação Pré-1ª Rodada'
      });
    } else {
      setAlerta({
        isOpen: true,
        type: 'info',
        title: res.logEntry.acao_titulo,
        message: res.logEntry.detalhes
      });
    }

    return true;
  }, [participantes, isMestre, jogadorFichaId, jogadorNome, obterPerfilRolagem, relogios, setAlerta, setParticipantes, setRelogios, setAcoesFeed, dispararOportunidadeCombate]);

  return {
    modalGrupoIniAberto,
    abrirModalGrupoIniciativa,
    fecharModalGrupoIniciativa,
    aplicarResultadoTesteGrupoIniciativa,
    executarAcaoPreRodada
  };
}
