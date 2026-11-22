import { useCallback } from 'react';
import { combatService } from '../../services/combatService';
import {
  extrairPerfilRolagemCombatente,
  rolarDadosCombate
} from '../../domain/fabula/combatRules';
import {
  extrairModificadorIniciativaHeroi,
  extrairIniciativaFixaInimigo
} from '../../domain/fabula/combatInitiativeRules';
import { detectarHabilidadePreConflito } from '../../domain/fabula/combatPreConflictRules';

/**
 * useCombatRolls
 * Gerencia o cálculo de perfis de rolagem (incluindo modificador de iniciativa de heróis
 * e iniciativa fixa de NPCs) e execução de testes de dados com gatilho de Oportunidades.
 */
export function useCombatRolls({
  isMestre,
  participantes,
  fichasDisponiveis,
  npcsDisponiveis,
  estadoCombate,
  setAcoesFeed,
  setAlerta,
  jogadorFichaId,
  jogadorNome,
  onDispararOportunidade
}) {
  const obterPerfilRolagem = useCallback((combatente) => {
    if (!combatente) return null;
    const listaFichas = fichasDisponiveis || [];
    const listaNpcs = npcsDisponiveis || [];

    const fichaCorrespondente = combatente.tipo === 'heroi'
      ? listaFichas.find(
          (f) =>
            String(f.id) === String(combatente.ficha_id) ||
            f.nome_personagem?.toLowerCase() === combatente.nome?.toLowerCase()
        )
      : null;

    const npcIdVinculado = combatente.modificadores?.npc_id;
    const npcCorrespondente = combatente.tipo !== 'heroi'
      ? listaNpcs.find(
          (n) =>
            (npcIdVinculado && String(n.id) === String(npcIdVinculado)) ||
            n.nome?.toLowerCase() === combatente.nome?.toLowerCase()
        )
      : null;

    const perfilBase = extrairPerfilRolagemCombatente({
      combatente,
      ficha: fichaCorrespondente || null,
      npc: npcCorrespondente || null,
      modificadoresCena: estadoCombate?.modificadores_globais || {}
    });

    if (combatente.tipo === 'heroi') {
      const modHeroi = extrairModificadorIniciativaHeroi(combatente, fichaCorrespondente, perfilBase);
      const habPre = detectarHabilidadePreConflito(fichaCorrespondente);
      return {
        ...perfilBase,
        ficha: fichaCorrespondente || null,
        iniciativaMod: modHeroi,
        lacos: Array.isArray(fichaCorrespondente?.lacos) ? fichaCorrespondente.lacos : [],
        habilidadePreConflito: habPre
      };
    }

    const iniFixaNpc = extrairIniciativaFixaInimigo(combatente, npcCorrespondente, perfilBase);
    return {
      ...perfilBase,
      npc: npcCorrespondente || null,
      iniciativaMod: iniFixaNpc,
      iniciativaFixaNpc: iniFixaNpc
    };
  }, [fichasDisponiveis, npcsDisponiveis, estadoCombate?.modificadores_globais]);

  const rolarDadosNoCombate = useCallback(async (opcoes = {}) => {
    const {
      combatente,
      exibirPopup = true,
      ...restoOpcoes
    } = opcoes;

    const lista = participantes || [];
    const combatenteAlvo = combatente || lista.find((p) => String(p.id) === String(opcoes.combatenteId));
    if (!combatenteAlvo) return null;

    if (!isMestre) {
      const ehMeuPersonagem = (
        (jogadorFichaId && String(combatenteAlvo.ficha_id) === jogadorFichaId) ||
        (jogadorNome && combatenteAlvo.nome?.trim().toLowerCase() === jogadorNome?.trim().toLowerCase())
      );
      if (!ehMeuPersonagem) {
        setAlerta({
          isOpen: true,
          type: 'warning',
          title: 'Rolagem Não Permitida',
          message: 'Você só pode rolar dados para o seu próprio herói.'
        });
        return null;
      }
    }

    const perfil = opcoes.perfil || obterPerfilRolagem(combatenteAlvo);
    const resultado = rolarDadosCombate({
      combatente: combatenteAlvo,
      perfil,
      ...restoOpcoes
    });

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
        combatente: combatenteAlvo,
        resultadoRolagem: resultado,
        origemAcao: resultado.titulo
      });
    } else if (exibirPopup) {
      const tipoAlerta = resultado.isCritico ? 'success' : resultado.isFumble ? 'error' : 'info';
      setAlerta({
        isOpen: true,
        type: tipoAlerta,
        title: `🎲 ${resultado.autorNome} — ${resultado.titulo}`,
        message: resultado.detalhes
      });
    }

    return resultado;
  }, [participantes, obterPerfilRolagem, isMestre, jogadorFichaId, jogadorNome, setAlerta, setAcoesFeed, onDispararOportunidade]);

  return {
    obterPerfilRolagem,
    rolarDadosNoCombate
  };
}
