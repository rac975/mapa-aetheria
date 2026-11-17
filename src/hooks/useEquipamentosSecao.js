import { useState, useEffect, useCallback, useMemo } from 'react';
import { fichaService } from '../services/fichaService';
import {
  SLOTS_EQUIPAMENTO,
  validarSlotEquipamento,
  isArmaDuasMaos
} from '../domain/fabula/equipmentRules';
import { normalizarTextoHF } from '../domain/fabula/highFantasyRules';
import { rolarAtaqueEDanoArma } from '../utils/calculosFicha';
import { useToast } from '../contexts/ToastContext';

const getNivelHabPorTermo = (classes, termo) => {
  let maxNivel = 0;
  (classes || []).forEach((c) => {
    (c.habilidades || []).forEach((h) => {
      const nome = normalizarTextoHF(h?.nome || '');
      if (nome.includes(termo)) {
        const nv = parseInt(h.nivel, 10) || 0;
        if (nv > maxNivel) maxNivel = nv;
      }
    });
  });
  return maxNivel;
};

const temPoderHeroicoTermo = (poderesHeroicos = [], termo) => {
  return (poderesHeroicos || []).some((p) => {
    const raw = typeof p === 'string' ? p : `${p?.key || ''} ${p?.nome || ''}`;
    return normalizarTextoHF(raw).includes(termo);
  });
};

export function useEquipamentosSecao({
  fichaId,
  atributosAtuais = {},
  classes = [],
  opcoesGolpeAtivo = null,
  limparGolpeAtivo = null,
  emCriseGlobal = false,
  statusFicha = null
}) {
  const [itensInventario, setItensInventario] = useState([]);
  const [modalSlotAberto, setModalSlotAberto] = useState(null);
  const [itemParaEquiparDireto, setItemParaEquiparDireto] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [modoAtaqueState, setModoAtaqueState] = useState({
    mao_dominante: 'normal',
    mao_secundaria: 'normal'
  });
  const [resultadosRolagem, setResultadosRolagem] = useState({});

  const [usarPsicocinese, setUsarPsicocinese] = useState(false);
  const [usarConhecimentoEPoder, setUsarConhecimentoEPoder] = useState(false);
  const [usarAtaquePoderoso, setUsarAtaquePoderoso] = useState(false);
  const [usarTiroPoderoso, setUsarTiroPoderoso] = useState(false);
  const [usarFocoCognitivo, setUsarFocoCognitivo] = useState(true);
  const [usarSimboloVerdade, setUsarSimboloVerdade] = useState(false);
  const [usarTrilhaEpica, setUsarTrilhaEpica] = useState(false);
  const [usarCascataInvocador, setUsarCascataInvocador] = useState(false);
  const [usarPragaElemental, setUsarPragaElemental] = useState(true);

  const { coldDelete } = useToast();

  const opcoesTaticas = useMemo(() => {
    const temPsicocinese = getNivelHabPorTermo(classes, 'psicocinese') > 0;
    const temConhecimentoEPoder = getNivelHabPorTermo(classes, 'conhecimento e poder') > 0;
    const nvAtaquePoderoso = getNivelHabPorTermo(classes, 'ataque poderoso');
    const nvTiroPoderoso = getNivelHabPorTermo(classes, 'tiro poderoso');
    const poderes = statusFicha?.poderesHeroicosAtivos || [];
    const temHoplita = temPoderHeroicoTermo(poderes, 'hoplita');
    const temTrilhaEpica = temPoderHeroicoTermo(poderes, 'trilha epica');
    const sinergias = statusFicha?.sinergias || {};
    const nf = statusFicha?.naturalFantasy || {};
    const bonusFocoTeste = sinergias.bonusFocoTeste || 0;
    const temSimboloVerdadeProprio = Boolean(sinergias.simbolista?.temSimboloVerdadeProprio);
    const temSimboloVerdadeCena = temSimboloVerdadeProprio || (sinergias.simbolista?.qtdSimbolosVerdadeInimigos || 0) > 0;

    return {
      temPsicocinese,
      temConhecimentoEPoder,
      nvAtaquePoderoso,
      nvTiroPoderoso,
      temHoplita,
      temTrilhaEpica,
      bonusFocoTeste,
      focoCognitivoAtivo: Boolean(sinergias.focoCognitivoAtivo && bonusFocoTeste > 0),
      temSimboloVerdadeCena,
      bonusDanoDecreto: sinergias.bonusDanoDecreto || 0,
      precisaoPiloto: Number(statusFicha?.precisaoBonus) || 0,
      bonusPrecisaoCascata: nf.invocador?.bonusPrecisaoCascata || 0,
      bonusDanoPragaAtiva: nf.invocador?.bonusDanoPragaAtiva || 0,
      nomePragaAtiva: nf.invocador?.pragaAtivaInimigo?.nome || null,
      conversaoDanoNatural: nf.conversaoDanoAtiva || null,
      bonusDanoBeladona: nf.floralista?.bonusDanoVenenoBeladona || 0
    };
  }, [classes, statusFicha]);

  const carregarItens = useCallback(async () => {
    if (!fichaId) return;
    try {
      const lista = await fichaService.getItensByFichaId(fichaId);
      setItensInventario(Array.isArray(lista) ? lista : []);
    } catch (err) {
      console.error('Falha na requisição de itens:', err);
    } finally {
      setCarregando(false);
    }
  }, [fichaId]);

  useEffect(() => {
    let ativo = true;
    const sincronizar = async () => {
      if (!fichaId) {
        if (ativo) setCarregando(false);
        return;
      }
      await carregarItens();
    };
    sincronizar();

    if (!fichaId) return;
    const channel = fichaService.subscribeItens(fichaId, () => {
      carregarItens();
    });
    return () => {
      ativo = false;
      fichaService.removeChannel(channel);
    };
  }, [fichaId, carregarItens]);

  const getItemNoSlot = useCallback(
    (slotName) => itensInventario.find((i) => i.stats_personalizados?.slot === slotName),
    [itensInventario]
  );

  const desequiparItem = async (item) => {
    const novosStats = { ...(item.stats_personalizados || {}) };
    delete novosStats.slot;
    try {
      await fichaService.atualizarItemPersonagem(item.id, {
        equipado: false,
        stats_personalizados: novosStats
      });
      carregarItens();
    } catch (err) {
      console.error('Erro ao desequipar item:', err);
    }
  };

  const trocarRapidoItem = async (item, slotAlvo) => {
    const validacao = validarSlotEquipamento({ item, slotAlvo, classes });
    if (!validacao.permitido) {
      alert(validacao.motivo);
      return;
    }

    const slotOrigem = item.stats_personalizados?.slot;
    const itemAtualNoSlot = getItemNoSlot(slotAlvo);
    const ehDuasMaos = isArmaDuasMaos(item);

    try {
      if (itemAtualNoSlot && slotOrigem && slotOrigem !== slotAlvo) {
        const validacaoOrigem = validarSlotEquipamento({ item: itemAtualNoSlot, slotAlvo: slotOrigem, classes });
        if (validacaoOrigem.permitido) {
          await fichaService.atualizarItemPersonagem(itemAtualNoSlot.id, {
            equipado: true,
            stats_personalizados: {
              ...(itemAtualNoSlot.stats_personalizados || {}),
              slot: slotOrigem
            }
          });
        } else {
          await desequiparItem(itemAtualNoSlot);
        }
      } else if (itemAtualNoSlot) {
        await desequiparItem(itemAtualNoSlot);
      }

      const slotParaSalvar = ehDuasMaos ? SLOTS_EQUIPAMENTO.MAO_DOMINANTE : slotAlvo;
      await fichaService.atualizarItemPersonagem(item.id, {
        equipado: true,
        stats_personalizados: {
          ...(item.stats_personalizados || {}),
          slot: slotParaSalvar
        }
      });

      if (ehDuasMaos) {
        const outraMao = getItemNoSlot(SLOTS_EQUIPAMENTO.MAO_SECUNDARIA);
        if (outraMao && outraMao.id !== item.id) {
          await desequiparItem(outraMao);
        }
      }

      setModalSlotAberto(null);
      setItemParaEquiparDireto(null);
      carregarItens();
    } catch (err) {
      console.error('Erro na troca rápida de itens:', err);
      alert('Erro ao equipar item: ' + err.message);
    }
  };

  const equiparItemNoSlot = (item, slotAlvo) => trocarRapidoItem(item, slotAlvo);

  const lidarComCliqueEquipar = (item) => {
    const tipoItem = (item.tipo || '').toLowerCase();
    if (tipoItem.includes('armadura')) return equiparItemNoSlot(item, SLOTS_EQUIPAMENTO.ARMADURA);
    if (tipoItem.includes('acessorio') || tipoItem.includes('acessório')) return equiparItemNoSlot(item, SLOTS_EQUIPAMENTO.ACESSORIO);
    if (tipoItem.includes('escudo')) return equiparItemNoSlot(item, SLOTS_EQUIPAMENTO.MAO_SECUNDARIA);
    setItemParaEquiparDireto(item);
  };

  const deletarItem = (item) => {
    coldDelete({
      item,
      message: `Item ${item.nome} descartado do inventário.`,
      onRemove: (it) => setItensInventario((prev) => prev.filter((x) => x.id !== it.id)),
      onCommit: async (it) => {
        try {
          await fichaService.deletarItemPersonagem(it.id);
          carregarItens();
        } catch (err) {
          console.error('Erro ao deletar item:', err);
        }
      },
      onRollback: (it) => setItensInventario((prev) => [...prev, it]),
      duration: 6000
    });
  };

  const bonusPrecisaoAtivos =
    opcoesTaticas.precisaoPiloto +
    (opcoesTaticas.focoCognitivoAtivo && usarFocoCognitivo ? opcoesTaticas.bonusFocoTeste : 0) +
    (opcoesTaticas.temSimboloVerdadeCena && usarSimboloVerdade ? 2 : 0) +
    (opcoesTaticas.bonusPrecisaoCascata > 0 && usarCascataInvocador ? opcoesTaticas.bonusPrecisaoCascata : 0);

  const executarRolagemArma = (itemArma, slotId) => {
    const isMulti = modoAtaqueState[slotId] === 'multi';
    const stats = itemArma?.stats_personalizados || {};
    const alcanceNorm = normalizarTextoHF(`${stats.alcance || ''} ${stats.categoria || ''} ${itemArma?.tipo || ''}`);
    const ehDistancia =
      alcanceNorm.includes('distancia') ||
      alcanceNorm.includes('arco') ||
      alcanceNorm.includes('fogo') ||
      alcanceNorm.includes('arremesso') ||
      alcanceNorm.includes('besta');

    let bonusDanoExtra = 0;
    if (usarAtaquePoderoso && opcoesTaticas.nvAtaquePoderoso > 0 && !ehDistancia) {
      bonusDanoExtra += opcoesTaticas.nvAtaquePoderoso * 2;
    }
    if (usarTiroPoderoso && opcoesTaticas.nvTiroPoderoso > 0 && ehDistancia) {
      bonusDanoExtra += opcoesTaticas.nvTiroPoderoso * 2;
    }
    if (opcoesTaticas.bonusDanoPragaAtiva > 0 && usarPragaElemental) {
      bonusDanoExtra += opcoesTaticas.bonusDanoPragaAtiva;
    }
    const nomeCatNorm = normalizarTextoHF(`${itemArma?.nome || ''} ${stats.categoria || ''}`);
    if (opcoesTaticas.temHoplita && nomeCatNorm.includes('lanca') && !isArmaDuasMaos(itemArma)) {
      bonusDanoExtra += 5;
    }

    const resultadoCalculado = rolarAtaqueEDanoArma(
      itemArma,
      atributosAtuais,
      isMulti,
      classes,
      itensInventario,
      {
        ...(opcoesGolpeAtivo || {}),
        usarPsicocinese,
        usarConhecimentoEPoder,
        criticoExpandido: opcoesTaticas.temTrilhaEpica && usarTrilhaEpica,
        bonusPrecisaoExtra: bonusPrecisaoAtivos,
        bonusDanoExtra
      },
      emCriseGlobal
    );

    const usandoGolpe = Boolean(opcoesGolpeAtivo?.usandoGolpeDasSombras);
    setResultadosRolagem((prev) => ({
      ...prev,
      [slotId]: {
        ...resultadoCalculado,
        usandoGolpe,
        usandoPsicocinese: usarPsicocinese,
        danoExtraGolpe: resultadoCalculado.danoExtraHabilidade || 0
      }
    }));

    if (usandoGolpe && limparGolpeAtivo) {
      limparGolpeAtivo();
    }
  };

  return {
    itensInventario,
    carregando,
    modalSlotAberto,
    setModalSlotAberto,
    itemParaEquiparDireto,
    setItemParaEquiparDireto,
    modoAtaqueState,
    setModoAtaqueState,
    resultadosRolagem,
    opcoesTaticas,
    bonusPrecisaoAtivos,
    toggles: {
      usarPsicocinese,
      setUsarPsicocinese,
      usarConhecimentoEPoder,
      setUsarConhecimentoEPoder,
      usarAtaquePoderoso,
      setUsarAtaquePoderoso,
      usarTiroPoderoso,
      setUsarTiroPoderoso,
      usarFocoCognitivo,
      setUsarFocoCognitivo,
      usarSimboloVerdade,
      setUsarSimboloVerdade,
      usarTrilhaEpica,
      setUsarTrilhaEpica,
      usarCascataInvocador,
      setUsarCascataInvocador,
      usarPragaElemental,
      setUsarPragaElemental
    },
    getItemNoSlot,
    desequiparItem,
    trocarRapidoItem,
    equiparItemNoSlot,
    lidarComCliqueEquipar,
    deletarItem,
    executarRolagemArma
  };
}
