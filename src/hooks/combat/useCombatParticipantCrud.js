import { useState, useCallback } from 'react';
import { combatService } from '../../services/combatService';
import {
  isNpcCombatente,
  clampRecursoNpc,
  extrairHpMax,
  extrairMpMax,
  calcularDanoAcumulado,
  verificarGatilhoTransicaoFase,
  aplicarDeltaRecurso,
  calcularAcoesPorTurnoNpc
} from '../../domain/fabula/combatRules';
import {
  construirCombatente,
  extrairModificadorIniciativaHeroi,
  extrairIniciativaFixaInimigo
} from '../../domain/fabula/combatInitiativeRules';

function criarCombatenteNpc(cat, novaOrdem) {
  const tipoVilao = cat.tipo_vilao || (cat.rank === 'campeao' ? 'campeao' : cat.rank === 'elite' ? 'elite' : 'padrao');
  const fases = Array.isArray(cat.fases_chefao) ? cat.fases_chefao : [];
  const faseInicial = Math.max(1, Number(cat.fase_atual) || 1);
  const faseObj = fases.find((f, i) => (Number(f.numero) || i + 1) === faseInicial) || fases[0] || null;
  const acoes = Number(faseObj?.acoes_por_turno) || Number(cat.acoes_por_turno) || calcularAcoesPorTurnoNpc({
    rank: cat.rank, tipoVilao, quantidadeSoldados: cat.quantidade_soldados
  });
  const ehVoador = Boolean(
    cat.voador ||
    (cat.poderes || []).some((p) => String(p?.nome || p).toLowerCase().includes('voador')) ||
    String(cat.regras_especiais || cat.descricao || '').toLowerCase().includes('voador')
  );
  const iniFixa = extrairIniciativaFixaInimigo({ tipo_vilao: tipoVilao, acoes_por_turno: acoes }, cat);
  return construirCombatente({
    tipo: 'inimigo', nome: cat.nome, ordem: novaOrdem,
    hpMax: Number(faseObj?.pv_max) || cat.pv_max || 30,
    mpMax: Number(faseObj?.pm_max) || cat.pm_max || 20,
    tipoVilao, pontosVilao: cat.pontos_vilao, fasesChefao: fases,
    acoesPorTurno: acoes, faseAtual: faseInicial, npcId: cat.id,
    voador: ehVoador, iniciativa: iniFixa
  });
}

/**
 * useCombatParticipantCrud
 * Gerencia adição, edição, remoção com cold-delete e alteração de recursos dos combatentes.
 */
export function useCombatParticipantCrud({
  isMestre,
  participantes,
  setParticipantes,
  fichasDisponiveis,
  setAlerta,
  jogadorFichaId,
  jogadorNome,
  coldDelete
}) {
  const [editandoId, setEditandoId] = useState(null);
  const [editForm, setEditForm] = useState({ nome: '', hp_max: 0, mp_max: 0, ip: 0, pontos_fabula: 0 });

  const addParticipante = useCallback(async ({
    tipo, fichaSelecionadaId, nomeInimigo, hpMaxInput, mpMaxInput,
    tipoVilaoInput = 'padrao', acoesPorTurnoInput = 1, voadorInput = false,
    npcCatalogoSelecionado
  }) => {
    if (!isMestre) return false;
    const lista = participantes || [];
    const novaOrdem = lista.length > 0 ? lista[lista.length - 1].ordem + 1 : 0;
    let novoCombatente = null;

    if (tipo === 'heroi') {
      const fichaEncontrada = (fichasDisponiveis || []).find((f) => f.id === fichaSelecionadaId);
      if (!fichaEncontrada) {
        setAlerta({ isOpen: true, type: 'warning', title: 'Atenção', message: 'Selecione uma ficha válida.' });
        return false;
      }
      if (lista.some((p) => p.nome.toLowerCase() === fichaEncontrada.nome_personagem.toLowerCase())) {
        setAlerta({ isOpen: true, type: 'warning', title: 'Herói Duplicado', message: `O herói "${fichaEncontrada.nome_personagem}" já está na cena!` });
        return false;
      }
      const modIniHeroi = extrairModificadorIniciativaHeroi(null, fichaEncontrada);
      novoCombatente = construirCombatente({
        tipo: 'heroi', nome: fichaEncontrada.nome_personagem, ordem: novaOrdem,
        hpMax: fichaEncontrada.hp_max || 40, mpMax: fichaEncontrada.mp_max || 40,
        ip: fichaEncontrada.pi_max || 6, pontosFabula: fichaEncontrada.fabula || 3,
        pontosUltima: 0, fichaId: fichaEncontrada.id, iniciativa: 0, iniciativaMod: modIniHeroi
      });
    } else if (npcCatalogoSelecionado && (!nomeInimigo || nomeInimigo.trim() === '')) {
      novoCombatente = criarCombatenteNpc(npcCatalogoSelecionado, novaOrdem);
    } else {
      if (!nomeInimigo || !nomeInimigo.trim()) {
        setAlerta({ isOpen: true, type: 'warning', title: 'Campo Vazio', message: 'Digite o nome do inimigo.' });
        return false;
      }
      const iniFallback = extrairIniciativaFixaInimigo({
        tipo_vilao: tipoVilaoInput,
        acoes_por_turno: Number(acoesPorTurnoInput) || 1
      });
      novoCombatente = construirCombatente({
        tipo: 'inimigo', nome: nomeInimigo.trim(), ordem: novaOrdem,
        hpMax: Number(hpMaxInput), mpMax: Number(mpMaxInput), tipoVilao: tipoVilaoInput,
        acoesPorTurno: Number(acoesPorTurnoInput) || 1, voador: Boolean(voadorInput),
        iniciativa: iniFallback
      });
    }

    const { data, error } = await combatService.addParticipante(novoCombatente);
    if (!error && data && data.length > 0) {
      setParticipantes((prev) => [...prev, data[0]]);
      return true;
    }
    return false;
  }, [isMestre, participantes, fichasDisponiveis, setAlerta, setParticipantes]);

  const iniciarExclusao = useCallback((p) => {
    if (!isMestre) return;
    if (coldDelete) {
      coldDelete({
        item: p,
        message: `${p.nome} foi removido da cena.`,
        onRemove: (it) => setParticipantes((prev) => prev.filter((item) => item.id !== it.id)),
        onCommit: async (it) => { await combatService.deleteParticipante(it.id); },
        onRollback: (it) => setParticipantes((prev) => [...prev, it].sort((a, b) => a.ordem - b.ordem)),
        duration: 6000
      });
    } else {
      setParticipantes((prev) => prev.filter((item) => item.id !== p.id));
      combatService.deleteParticipante(p.id);
    }
  }, [isMestre, coldDelete, setParticipantes]);

  const salvarEdicao = useCallback(async (id) => {
    const lista = participantes || [];
    const participanteAtual = lista.find((p) => p.id === id);
    const isNpc = isNpcCombatente(participanteAtual);
    const novoHpMax = Number(editForm.hp_max);
    const novoMpMax = Number(editForm.mp_max);

    const payload = {
      nome: editForm.nome, hp_max: novoHpMax, mp_max: novoMpMax,
      ip: Number(editForm.ip), pontos_fabula: Number(editForm.pontos_fabula)
    };

    if (isNpc && participanteAtual) {
      if (novoHpMax > 0 && Number(participanteAtual.hp_atual) > novoHpMax) {
        payload.hp_atual = clampRecursoNpc(participanteAtual.hp_atual, novoHpMax, 0);
        payload.dano_acumulado = calcularDanoAcumulado(payload.hp_atual, novoHpMax);
      }
      if (novoMpMax >= 0 && Number(participanteAtual.mp_atual) > novoMpMax) {
        payload.mp_atual = clampRecursoNpc(participanteAtual.mp_atual, novoMpMax, 0);
      }
    }

    setParticipantes((prev) => prev.map((p) => (p.id === id ? { ...p, ...payload } : p)));
    setEditandoId(null);
    await combatService.updateParticipante(id, payload);

    if (participanteAtual?.tipo === 'heroi' && participanteAtual.ficha_id) {
      await combatService.updateFichaPersonagemFromCombat(participanteAtual.ficha_id, {
        hp_max: novoHpMax, mp_max: novoMpMax, pi_max: Number(editForm.ip), fabula: Number(editForm.pontos_fabula)
      });
    }
  }, [editForm, participantes, setParticipantes]);

  const cancelarEdicao = useCallback(() => setEditandoId(null), []);

  const alterarRecurso = useCallback(async (id, campo, valorAtual, delta, maximo = null) => {
    const lista = participantes || [];
    const participanteAtual = lista.find((p) => p.id === id);
    const ehMeu = !isMestre && participanteAtual && (
      (jogadorFichaId && String(participanteAtual.ficha_id) === jogadorFichaId) ||
      (jogadorNome && participanteAtual.nome?.trim().toLowerCase() === jogadorNome?.trim().toLowerCase())
    );
    if (!isMestre && !ehMeu) return;
    const isNpc = isNpcCombatente(participanteAtual);
    const updates = {};
    let novoValor;

    if (isNpc && (campo === 'hp_atual' || campo === 'mp_atual')) {
      const maximoEfetivo = campo === 'hp_atual'
        ? (maximo !== null && maximo !== undefined ? Number(maximo) : extrairHpMax(participanteAtual))
        : (maximo !== null && maximo !== undefined ? Number(maximo) : extrairMpMax(participanteAtual));
      novoValor = clampRecursoNpc((Number(valorAtual) || 0) + (Number(delta) || 0), maximoEfetivo, 0);
      updates[campo] = novoValor;
      if (campo === 'hp_atual') {
        updates.dano_acumulado = calcularDanoAcumulado(novoValor, maximoEfetivo);
        const checkFase = verificarGatilhoTransicaoFase({
          hpAtual: novoValor, hpMax: maximoEfetivo, faseAtual: participanteAtual.fase_atual || 1, fasesChefao: participanteAtual.fases_chefao || []
        });
        if (checkFase.gatilhoAtivo && checkFase.proximaFaseObj && Number(valorAtual) > 0 && novoValor === 0) {
          setAlerta({ isOpen: true, type: 'warning', title: `⚡ Gatilho de Fase — ${participanteAtual.nome}`, message: checkFase.motivo });
        }
      }
    } else {
      novoValor = aplicarDeltaRecurso(valorAtual, delta, maximo, 0);
      updates[campo] = novoValor;
      if (campo === 'pontos_vilao') updates.pontos_ultima = novoValor;
    }

    setParticipantes((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    await combatService.updateParticipante(id, updates);

    if (participanteAtual?.tipo === 'heroi' && participanteAtual.ficha_id) {
      await combatService.updateRecursoFicha(participanteAtual.ficha_id, campo, novoValor);
    } else if (isNpc && participanteAtual?.modificadores?.npc_id) {
      await combatService.updateNpcMestreFromCombat(participanteAtual.modificadores.npc_id, updates);
    }
  }, [isMestre, participantes, jogadorFichaId, jogadorNome, setAlerta, setParticipantes]);

  return {
    editandoId, setEditandoId, editForm, setEditForm,
    addParticipante, iniciarExclusao, salvarEdicao, cancelarEdicao, alterarRecurso
  };
}
