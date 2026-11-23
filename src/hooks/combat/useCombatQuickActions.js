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
  npcsDisponiveis = [],
  setNpcsDisponiveis = null,
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
    companheiroId = null,
    custoPmCompanheiro = 0,
    relogioId = null,
    custoPv = 0,
    custoPm = 0,
    custoPi = 0,
    custoPf = 0,
    piRecuperados = 0,
    danoAplicado = 0,
    curaAplicada = 0,
    recursoCura = 'pv',
    tipoDano = 'fisico',
    afinidadeAlvo = 'normal',
    condicaoAlvo = null,
    limparCondicoes = false,
    removerCondicaoAlvo = null,
    perdaPmAlvo = 0,
    avancoRelogio = 0,
    notaLivre = '',
    marcarTurnoConcluido = true
  }) => {
    const lista = participantes || [];
    const ator = lista.find((p) => String(p.id) === String(atorId));
    const compAlvo = (npcsDisponiveis || []).find(
      (n) => n.tipo_registro === 'companheiro' && (String(n.id) === String(alvoId) || `comp_${n.id}` === String(alvoId))
    );
    const alvo = alvoId
      ? (compAlvo
          ? { id: alvoId, nome: `🐾 ${compAlvo.nome}`, hp_atual: compAlvo.pv_atual, hp_max: compAlvo.pv_max, tipo: 'companheiro' }
          : lista.find((p) => String(p.id) === String(alvoId)))
      : null;

    const compOrigem = companheiroId
      ? (npcsDisponiveis || []).find(
          (n) => n.tipo_registro === 'companheiro' && (String(n.id) === String(companheiroId) || `comp_${n.id}` === String(companheiroId))
        )
      : null;

    if (compOrigem && custoPmCompanheiro > 0) {
      const pmAtualComp = Number(compOrigem.pm_atual) || 0;
      if (custoPmCompanheiro > pmAtualComp) {
        setAlerta({
          isOpen: true,
          type: 'warning',
          title: 'PM Insuficiente do Companheiro',
          message: `O companheiro ${compOrigem.nome} não possui PM suficientes (requer ${custoPmCompanheiro} PM, possui ${pmAtualComp}).`
        });
        return false;
      }
    }

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
      custoPv,
      custoPm: compOrigem ? 0 : custoPm,
      custoPi,
      custoPf,
      piRecuperados,
      danoAplicado,
      curaAplicada,
      recursoCura,
      tipoDano,
      afinidadeAlvo,
      condicaoAlvo,
      limparCondicoes,
      removerCondicaoAlvo,
      perdaPmAlvo,
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
      if (resultado.updatesAtor.fugiu) {
        if (ator.tipo === 'heroi' && ator.ficha_id) {
          await combatService.updateFichaPersonagemFromCombat(ator.ficha_id, resultado.updatesAtor);
        }
        await combatService.deleteParticipante(ator.id);
        setParticipantes((prev) => prev.filter((p) => p.id !== ator.id));
      } else {
        setParticipantes((prev) => prev.map((p) => (p.id === ator.id ? { ...p, ...resultado.updatesAtor } : p)));
        await combatService.updateParticipante(ator.id, resultado.updatesAtor);

        if (ator.tipo === 'heroi' && ator.ficha_id) {
          await combatService.updateFichaPersonagemFromCombat(ator.ficha_id, resultado.updatesAtor);
        }
      }
    }

    // 1.1 Débito de PM no próprio Companheiro
    if (compOrigem && custoPmCompanheiro > 0) {
      const novoPmComp = Math.max(0, (Number(compOrigem.pm_atual) || 0) - custoPmCompanheiro);
      await combatService.updateNpcMestreFromCombat(compOrigem.id, { pm_atual: novoPmComp });
      if (setNpcsDisponiveis) {
        setNpcsDisponiveis((prev) =>
          prev.map((n) => (n.id === compOrigem.id ? { ...n, pm_atual: novoPmComp } : n))
        );
      }
    }

    // 1.2 Efeito especial Lado a Lado (Andarilho): recupera 10 PM do companheiro fiel vinculado
    if (acaoCodigo === 'LADO_A_LADO_PM') {
      const compDoAtor = (npcsDisponiveis || []).find(
        (n) => n.tipo_registro === 'companheiro' && (
          String(n.personagem_id) === String(ator.ficha_id) ||
          String(n.mestre_id) === String(ator.id)
        )
      );
      if (compDoAtor) {
        const maxMpComp = compDoAtor.pm_max || 20;
        const novoPmComp = Math.min(maxMpComp, (Number(compDoAtor.pm_atual) || 0) + 10);
        await combatService.updateNpcMestreFromCombat(compDoAtor.id, { pm_atual: novoPmComp });
        if (setNpcsDisponiveis) {
          setNpcsDisponiveis((prev) =>
            prev.map((n) => (n.id === compDoAtor.id ? { ...n, pm_atual: novoPmComp } : n))
          );
        }
      }
    }

    // 2. Persiste alvo
    if (resultado.updatesAlvo && resultado.alvoId && resultado.alvoId !== ator.id) {
      if (compAlvo) {
        const novoPvComp = resultado.updatesAlvo.hp_atual !== undefined ? resultado.updatesAlvo.hp_atual : compAlvo.pv_atual;
        const novoPmComp = resultado.updatesAlvo.mp_atual !== undefined ? resultado.updatesAlvo.mp_atual : compAlvo.pm_atual;
        await combatService.updateNpcMestreFromCombat(compAlvo.id, { pv_atual: novoPvComp, pm_atual: novoPmComp });
        if (setNpcsDisponiveis) {
          setNpcsDisponiveis((prev) =>
            prev.map((n) => (n.id === compAlvo.id ? { ...n, pv_atual: novoPvComp, pm_atual: novoPmComp } : n))
          );
        }
      } else {
        const alvoObj = lista.find((p) => p.id === resultado.alvoId);
        setParticipantes((prev) => prev.map((p) => (p.id === resultado.alvoId ? { ...p, ...resultado.updatesAlvo } : p)));
        await combatService.updateParticipante(resultado.alvoId, resultado.updatesAlvo);

        if (alvoObj?.tipo === 'heroi' && alvoObj.ficha_id) {
          await combatService.updateFichaPersonagemFromCombat(alvoObj.ficha_id, resultado.updatesAlvo);
        }
      }
    }

    // 3. Avança Relógio de Conflito
    const idRelogioEfetivo = relogioId || (relogios || [])[0]?.id || null;
    if (resultado.deltaRelogio !== 0 && idRelogioEfetivo) {
      const listaRelogios = relogios || [];
      const relogioAlvo = listaRelogios.find((r) => String(r.id) === String(idRelogioEfetivo));
      if (relogioAlvo) {
        const maxSec = relogioAlvo.fatias_total ?? relogioAlvo.secoes_max ?? 4;
        const atuaisSec = Number(relogioAlvo.fatias_atuais ?? relogioAlvo.secoes_preenchidas) || 0;
        const novasFatias = Math.max(0, Math.min(maxSec, atuaisSec + resultado.deltaRelogio));
        setRelogios((prev) => prev.map((r) => (r.id === relogioAlvo.id ? { ...r, fatias_atuais: novasFatias } : r)));
        await combatService.avancarRelogioCombate(relogioAlvo.id, novasFatias);
      }
    }

    // 4. Feed de ações
    if (resultado.logEntry) {
      if (compOrigem) {
        resultado.logEntry.autor_nome = `🐾 ${compOrigem.nome} (${ator.nome})`;
      }
      const { data } = await combatService.registrarAcaoCombate(resultado.logEntry);
      if (data) {
        setAcoesFeed((prev) => [data, ...prev].slice(0, 30));
      }
    }

    return true;
  }, [participantes, npcsDisponiveis, setNpcsDisponiveis, estadoCombate?.modificadores_globais, relogios, isMestre, jogadorFichaId, jogadorNome, setAlerta, setParticipantes, setRelogios, setAcoesFeed]);

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
