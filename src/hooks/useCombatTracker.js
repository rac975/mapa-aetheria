import { useState, useEffect, useCallback, useRef } from 'react';
import { combatService } from '../services/combatService';
import {
  alternarTurno,
  aplicarDeltaRecurso,
  alternarCondicao,
  reordenarParticipantes,
  construirCombatente
} from '../domain/fabula/combatRules';

/**
 * Hook customizado para gerenciar estado, ações e sincronização em tempo real do combate
 * 
 * Regra Arquitetural (GEMINI.md):
 * Centraliza estados locais, erros, chamadas aos Services e subscriptions de realtime.
 */
export function useCombatTracker(isMestre) {
  const [participantes, setParticipantes] = useState([]);
  const [fichasDisponiveis, setFichasDisponiveis] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alerta, setAlerta] = useState({ isOpen: false, title: '', message: '' });

  // Exclusão com Toast e Undo
  const [itemParaExcluir, setItemParaExcluir] = useState(null);
  const [mostrarToast, setMostrarToast] = useState(false);
  const [progressoKey, setProgressoKey] = useState(0);
  const timeoutIdRef = useRef(null);

  // Edição inline
  const [editandoId, setEditandoId] = useState(null);
  const [editForm, setEditForm] = useState({ nome: '', hp_max: 0, mp_max: 0, ip: 0, pontos_fabula: 0 });

  const carregarDados = useCallback(async () => {
    try {
      const [fichasRes, iniciativaRes] = await Promise.all([
        combatService.getFichasPersonagens(),
        combatService.getParticipantes()
      ]);

      if (fichasRes.data) {
        setFichasDisponiveis(fichasRes.data);
      }
      if (iniciativaRes.data) {
        setParticipantes(iniciativaRes.data);
      }
    } catch (err) {
      console.error('Erro ao carregar dados de combate:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const recarregarParticipantes = useCallback(async () => {
    const { data } = await combatService.getParticipantes();
    if (data) {
      setParticipantes(data);
    }
  }, []);

  useEffect(() => {
    carregarDados();

    const subscription = combatService.subscribeIniciativa(() => {
      recarregarParticipantes();
    });

    return () => {
      subscription.unsubscribe();
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [carregarDados, recarregarParticipantes]);

  const toggleTurno = useCallback(async (id, statusAtual) => {
    const novoStatus = alternarTurno(statusAtual);
    setParticipantes(prev => prev.map(p => p.id === id ? { ...p, agiu: novoStatus } : p));
    await combatService.updateParticipante(id, { agiu: novoStatus });
  }, []);

  const resetRodada = useCallback(async () => {
    if (!isMestre) return;
    setParticipantes(prev => prev.map(p => ({ ...p, agiu: false })));
    await combatService.resetRodada(participantes.map(p => p.id));
  }, [isMestre, participantes]);

  const restaurarTudoCena = useCallback(async () => {
    if (!isMestre) return;
    const atualizados = participantes.map(p => ({
      ...p,
      agiu: false,
      hp_atual: p.hp_max,
      mp_atual: p.mp_max
    }));
    setParticipantes(atualizados);
    await combatService.restaurarCena(participantes);
  }, [isMestre, participantes]);

  const addParticipante = useCallback(async ({
    tipo,
    fichaSelecionadaId,
    nomeInimigo,
    hpMaxInput,
    mpMaxInput,
    npcCatalogoSelecionado
  }) => {
    if (!isMestre) return false;

    const novaOrdem = participantes.length > 0 ? participantes[participantes.length - 1].ordem + 1 : 0;
    let novoCombatente = null;

    if (tipo === 'heroi') {
      const fichaEncontrada = fichasDisponiveis.find(f => f.id === fichaSelecionadaId);
      if (!fichaEncontrada) {
        setAlerta({ isOpen: true, title: 'Atenção', message: 'Selecione uma ficha válida.' });
        return false;
      }

      const jaExiste = participantes.some(p => p.nome.toLowerCase() === fichaEncontrada.nome_personagem.toLowerCase());
      if (jaExiste) {
        setAlerta({
          isOpen: true,
          title: 'Herói Duplicado',
          message: `O herói "${fichaEncontrada.nome_personagem}" já está na ordem de combate!`
        });
        return false;
      }

      novoCombatente = construirCombatente({
        tipo: 'heroi',
        nome: fichaEncontrada.nome_personagem,
        ordem: novaOrdem,
        hpMax: fichaEncontrada.hp_max || 40,
        mpMax: fichaEncontrada.mp_max || 40,
        ip: fichaEncontrada.pi_max || 6,
        pontosFabula: fichaEncontrada.fabula || 3,
        pontosUltima: 0,
        fichaId: fichaEncontrada.id
      });
    } else {
      if (npcCatalogoSelecionado && (!nomeInimigo || nomeInimigo.trim() === '')) {
        novoCombatente = construirCombatente({
          tipo: 'inimigo',
          nome: npcCatalogoSelecionado.nome,
          ordem: novaOrdem,
          hpMax: npcCatalogoSelecionado.pv_max || 30,
          mpMax: npcCatalogoSelecionado.pm_max || 20,
          ip: 0,
          pontosFabula: 0,
          pontosUltima: 3,
          fichaId: null
        });
      } else {
        if (!nomeInimigo || !nomeInimigo.trim()) {
          setAlerta({ isOpen: true, title: 'Campo Vazio', message: 'Digite o nome do inimigo.' });
          return false;
        }

        novoCombatente = construirCombatente({
          tipo: 'inimigo',
          nome: nomeInimigo.trim(),
          ordem: novaOrdem,
          hpMax: Number(hpMaxInput),
          mpMax: Number(mpMaxInput),
          ip: 0,
          pontosFabula: 0,
          pontosUltima: 3,
          fichaId: null
        });
      }
    }

    const { data, error } = await combatService.addParticipante(novoCombatente);
    if (!error && data && data.length > 0) {
      setParticipantes(prev => [...prev, data[0]]);
      return true;
    }
    return false;
  }, [isMestre, participantes, fichasDisponiveis]);

  const iniciarExclusao = useCallback((p) => {
    if (!isMestre) return;
    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);

    setParticipantes(prev => prev.filter(item => item.id !== p.id));
    setItemParaExcluir(p);
    setMostrarToast(true);
    setProgressoKey(prev => prev + 1);

    const timer = setTimeout(async () => {
      await combatService.deleteParticipante(p.id);
      setMostrarToast(false);
      setItemParaExcluir(null);
    }, 6000);

    timeoutIdRef.current = timer;
  }, [isMestre]);

  const desfazerExclusao = useCallback(() => {
    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    if (itemParaExcluir) {
      setParticipantes(prev => [...prev, itemParaExcluir].sort((a, b) => a.ordem - b.ordem));
    }
    setMostrarToast(false);
    setItemParaExcluir(null);
  }, [itemParaExcluir]);

  const salvarEdicao = useCallback(async (id) => {
    const payload = {
      nome: editForm.nome,
      hp_max: Number(editForm.hp_max),
      mp_max: Number(editForm.mp_max),
      ip: Number(editForm.ip),
      pontos_fabula: Number(editForm.pontos_fabula)
    };

    setParticipantes(prev => prev.map(p => p.id === id ? { ...p, ...payload } : p));
    setEditandoId(null);
    await combatService.updateParticipante(id, payload);
  }, [editForm]);

  const cancelarEdicao = useCallback(() => {
    setEditandoId(null);
  }, []);

  const alterarRecurso = useCallback(async (id, campo, valorAtual, delta, maximo = null) => {
    if (!isMestre) return;
    const novoValor = aplicarDeltaRecurso(valorAtual, delta, maximo, 0);

    setParticipantes(prev => prev.map(p => p.id === id ? { ...p, [campo]: novoValor } : p));
    await combatService.updateParticipante(id, { [campo]: novoValor });

    const participanteAtual = participantes.find(p => p.id === id);
    if (participanteAtual && participanteAtual.tipo === 'heroi' && participanteAtual.ficha_id) {
      await combatService.updateRecursoFicha(participanteAtual.ficha_id, campo, novoValor);
    }
  }, [isMestre, participantes]);

  const toggleCondicao = useCallback(async (p, condicaoId) => {
    if (!isMestre) return;
    const atuais = p.condicoes || [];
    const novasCondicoes = alternarCondicao(atuais, condicaoId);

    setParticipantes(prev => prev.map(item => item.id === p.id ? { ...item, condicoes: novasCondicoes } : item));
    const { error } = await combatService.updateParticipante(p.id, { condicoes: novasCondicoes });
    if (error) {
      console.error('Erro ao atualizar condições no banco:', error.message);
    }
  }, [isMestre]);

  const moverItem = useCallback(async (index, direcao) => {
    if (!isMestre) return;
    const novaLista = reordenarParticipantes(participantes, index, direcao);
    setParticipantes(novaLista);
    await combatService.salvarNovaOrdem(novaLista);
  }, [isMestre, participantes]);

  const fecharAlerta = useCallback(() => {
    setAlerta(prev => ({ ...prev, isOpen: false }));
  }, []);

  return {
    participantes,
    fichasDisponiveis,
    isLoading,
    alerta,
    fecharAlerta,
    itemParaExcluir,
    mostrarToast,
    progressoKey,
    editandoId,
    editForm,
    setEditForm,
    toggleTurno,
    resetRodada,
    restaurarTudoCena,
    addParticipante,
    iniciarExclusao,
    desfazerExclusao,
    salvarEdicao,
    cancelarEdicao,
    alterarRecurso,
    toggleCondicao,
    moverItem
  };
}
