import { useState, useEffect, useCallback, useMemo } from 'react';
import { combatService } from '../services/combatService';
import { playerSessionService } from '../services/playerSessionService';
import { useToast } from '../contexts/ToastContext';
import {
  alternarTurno,
  aplicarDeltaRecurso,
  alternarCondicao,
  reordenarParticipantes,
  construirCombatente,
  resolverAcaoCombate,
  extrairPerfilRolagemCombatente,
  rolarDadosCombate,
  clampRecursoNpc,
  isNpcCombatente,
  extrairHpMax,
  extrairMpMax,
  calcularDanoAcumulado,
  calcularAcoesPorTurnoNpc,
  verificarGatilhoTransicaoFase,
  executarTransicaoFaseChefao,
  consumirPontoVilaoNpc
} from '../domain/fabula/combatRules';

/**
 * Hook customizado para gerenciar estado, ações rápidas, modificadores, relógios,
 * rolagens de dados integradas e sincronização em tempo real do combate via Supabase Realtime.
 */
export function useCombatTracker(isMestre) {
  const [participantes, setParticipantes] = useState([]);
  const [fichasDisponiveis, setFichasDisponiveis] = useState([]);
  const [npcsDisponiveis, setNpcsDisponiveis] = useState([]);
  const [estadoCombate, setEstadoCombate] = useState({ id: 1, rodada: 1, em_combate: true, modificadores_globais: {} });
  const [relogios, setRelogios] = useState([]);
  const [acoesFeed, setAcoesFeed] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alerta, setAlerta] = useState({ isOpen: false, title: '', message: '', type: 'alert' });
  const { coldDelete } = useToast();

  const [editandoId, setEditandoId] = useState(null);
  const [editForm, setEditForm] = useState({ nome: '', hp_max: 0, mp_max: 0, ip: 0, pontos_fabula: 0 });

  const sessaoJogador = useMemo(() => playerSessionService.obterSessao(), []);
  const jogadorFichaId = sessaoJogador?.fichaId ? String(sessaoJogador.fichaId) : null;
  const jogadorNome = sessaoJogador?.nomePersonagem || null;

  const recarregarParticipantes = useCallback(async () => {
    const { data } = await combatService.getParticipantes();
    if (data) setParticipantes(data);
  }, []);

  const recarregarFichas = useCallback(async () => {
    const { data } = await combatService.getFichasPersonagens();
    if (data) setFichasDisponiveis(data);
  }, []);

  const recarregarRelogios = useCallback(async () => {
    const { data } = await combatService.getRelogiosCombate();
    if (data) setRelogios(data);
  }, []);

  const recarregarAcoes = useCallback(async () => {
    const { data } = await combatService.getAcoesCombate(30);
    if (data) setAcoesFeed(data);
  }, []);

  useEffect(() => {
    let ativo = true;

    async function inicializarCombate() {
      try {
        const [fichasRes, npcsRes, iniciativaRes, estadoRes, relogiosRes, acoesRes] = await Promise.all([
          combatService.getFichasPersonagens(),
          combatService.getNpcsCombate(),
          combatService.getParticipantes(),
          combatService.getEstadoCombate(),
          combatService.getRelogiosCombate(),
          combatService.getAcoesCombate(30)
        ]);

        if (!ativo) return;
        if (fichasRes.data) setFichasDisponiveis(fichasRes.data);
        if (npcsRes.data) setNpcsDisponiveis(npcsRes.data);
        if (iniciativaRes.data) setParticipantes(iniciativaRes.data);
        if (estadoRes.data) setEstadoCombate(estadoRes.data);
        if (relogiosRes.data) setRelogios(relogiosRes.data);
        if (acoesRes.data) setAcoesFeed(acoesRes.data);
      } catch (err) {
        console.error('Erro ao carregar dados de combate:', err);
      } finally {
        if (ativo) setIsLoading(false);
      }
    }

    inicializarCombate();

    const subIniciativa = combatService.subscribeIniciativa(() => {
      recarregarParticipantes();
    });
    const subEstado = combatService.subscribeEstadoCombate(
      (novoEstado) => {
        if (novoEstado) setEstadoCombate(novoEstado);
      },
      () => recarregarRelogios()
    );
    const subAcoes = combatService.subscribeAcoesCombate(() => {
      recarregarAcoes();
    });
    const subFichas = combatService.subscribeFichasPersonagens(async (payload) => {
      await recarregarFichas();
      if (payload?.new && payload.new.id) {
        const fichaIdAtualizada = String(payload.new.id);
        setParticipantes((prev) =>
          prev.map((p) => {
            if (p.tipo === 'heroi' && String(p.ficha_id) === fichaIdAtualizada) {
              const novoP = {
                ...p,
                hp_atual: payload.new.hp_atual !== undefined ? Number(payload.new.hp_atual) : p.hp_atual,
                hp_max: payload.new.hp_max !== undefined ? Number(payload.new.hp_max) : p.hp_max,
                mp_atual: payload.new.mp_atual !== undefined ? Number(payload.new.mp_atual) : p.mp_atual,
                mp_max: payload.new.mp_max !== undefined ? Number(payload.new.mp_max) : p.mp_max,
                ip: (payload.new.pi_atual ?? payload.new.ip) !== undefined ? Number(payload.new.pi_atual ?? payload.new.ip) : p.ip,
                pontos_fabula: (payload.new.fabula ?? payload.new.pontos_fabula) !== undefined ? Number(payload.new.fabula ?? payload.new.pontos_fabula) : p.pontos_fabula,
                condicoes: Array.isArray(payload.new.condicoes) ? payload.new.condicoes : p.condicoes
              };
              combatService.updateIniciativaFromFicha(p.ficha_id, payload.new).catch(() => {});
              return novoP;
            }
            return p;
          })
        );
      }
    });

    return () => {
      ativo = false;
      subIniciativa.unsubscribe();
      subEstado.unsubscribe();
      subAcoes.unsubscribe();
      subFichas.unsubscribe();
    };
  }, [recarregarParticipantes, recarregarRelogios, recarregarAcoes, recarregarFichas]);

  const toggleTurno = useCallback(async (id, statusAtual) => {
    const participante = participantes.find((p) => p.id === id);
    const ehMeuPersonagem = !isMestre && participante && (
      (jogadorFichaId && String(participante.ficha_id) === jogadorFichaId) ||
      (jogadorNome && participante.nome?.trim().toLowerCase() === jogadorNome?.trim().toLowerCase())
    );
    if (!isMestre && !ehMeuPersonagem) return;

    const novoStatus = alternarTurno(statusAtual);
    setParticipantes((prev) => prev.map((p) => (p.id === id ? { ...p, agiu: novoStatus, turno_atual: false } : p)));
    await combatService.updateParticipante(id, { agiu: novoStatus, turno_atual: false });
  }, [isMestre, participantes, jogadorFichaId, jogadorNome]);

  const ativarTurnoParticipante = useCallback(async (participante) => {
    if (!participante?.id) return;
    const ehMeuPersonagem = !isMestre && (
      (jogadorFichaId && String(participante.ficha_id) === jogadorFichaId) ||
      (jogadorNome && participante.nome?.trim().toLowerCase() === jogadorNome?.trim().toLowerCase())
    );
    if (!isMestre && !ehMeuPersonagem) return;

    // Ao iniciar seu próximo turno, o efeito da ação Guarda anterior expira automaticamente
    setParticipantes((prev) =>
      prev.map((p) =>
        p.id === participante.id
          ? { ...p, turno_atual: true, guardando: false, protegendo_id: null }
          : { ...p, turno_atual: false }
      )
    );
    await combatService.definirTurnoAtivo(participante.id, participantes.map((p) => p.id));
    if (participante.guardando || participante.protegendo_id) {
      await combatService.updateParticipante(participante.id, { guardando: false, protegendo_id: null });
    }
  }, [isMestre, participantes, jogadorFichaId, jogadorNome]);

  const resetRodada = useCallback(async () => {
    if (!isMestre) return;
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
    await combatService.resetRodada(participantes, novaRodada);
    await combatService.registrarAcaoCombate({
      autor_nome: 'Mestre',
      autor_tipo: 'sistema',
      acao_codigo: 'NOVA_RODADA',
      acao_titulo: `Rodada ${novaRodada} Iniciada`,
      detalhes: 'Todos os combatentes recuperaram seus turnos (e multi-ações de Vilão) e posturas de Guarda encerraram.',
      metadata: { rodada: novaRodada }
    });
  }, [isMestre, participantes, estadoCombate?.rodada]);

  const restaurarTudoCena = useCallback(async () => {
    if (!isMestre) return;
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
    await combatService.restaurarCena(participantes);

    // Sincroniza restauração com fichas dos heróis
    for (const p of participantes) {
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
  }, [isMestre, participantes]);

  const atualizarModificadorGlobal = useCallback(async (novosMods) => {
    if (!isMestre) return;
    const combinados = { ...(estadoCombate?.modificadores_globais || {}), ...novosMods };
    setEstadoCombate((prev) => ({ ...prev, modificadores_globais: combinados }));
    await combatService.updateEstadoCombate({ modificadores_globais: combinados });
  }, [isMestre, estadoCombate?.modificadores_globais]);

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
    const ator = participantes.find((p) => String(p.id) === String(atorId));
    const alvo = alvoId ? participantes.find((p) => String(p.id) === String(alvoId)) : null;

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

    // 1. Atualiza estado otimista e persiste ator
    if (Object.keys(resultado.updatesAtor).length > 0) {
      setParticipantes((prev) => prev.map((p) => (p.id === ator.id ? { ...p, ...resultado.updatesAtor } : p)));
      await combatService.updateParticipante(ator.id, resultado.updatesAtor);

      if (ator.tipo === 'heroi' && ator.ficha_id) {
        await combatService.updateFichaPersonagemFromCombat(ator.ficha_id, resultado.updatesAtor);
      }
    }

    // 2. Persiste alvo (se diferente do ator)
    if (resultado.updatesAlvo && resultado.alvoId && resultado.alvoId !== ator.id) {
      const alvoObj = participantes.find((p) => p.id === resultado.alvoId);
      setParticipantes((prev) => prev.map((p) => (p.id === resultado.alvoId ? { ...p, ...resultado.updatesAlvo } : p)));
      await combatService.updateParticipante(resultado.alvoId, resultado.updatesAlvo);

      if (alvoObj?.tipo === 'heroi' && alvoObj.ficha_id) {
        await combatService.updateFichaPersonagemFromCombat(alvoObj.ficha_id, resultado.updatesAlvo);
      }
    }

    // 3. Avança Relógio de Conflito (Objetivo)
    if (resultado.deltaRelogio !== 0 && relogioId) {
      const relogioAlvo = relogios.find((r) => String(r.id) === String(relogioId));
      if (relogioAlvo) {
        const novasFatias = Math.max(0, Math.min(relogioAlvo.fatias_total, (Number(relogioAlvo.fatias_atuais) || 0) + resultado.deltaRelogio));
        setRelogios((prev) => prev.map((r) => (r.id === relogioAlvo.id ? { ...r, fatias_atuais: novasFatias } : r)));
        await combatService.avancarRelogioCombate(relogioAlvo.id, novasFatias);
      }
    }

    // 4. Dispara registro no feed em tempo real
    if (resultado.logEntry) {
      const { data } = await combatService.registrarAcaoCombate(resultado.logEntry);
      if (data) {
        setAcoesFeed((prev) => [data, ...prev].slice(0, 30));
      }
    }

    return true;
  }, [participantes, estadoCombate?.modificadores_globais, relogios, isMestre, jogadorFichaId, jogadorNome]);

  const limparHistoricoAcoes = useCallback(async () => {
    if (!isMestre) return;
    setAcoesFeed([]);
    await combatService.limparAcoesCombate();
  }, [isMestre]);

  const addParticipante = useCallback(async ({
    tipo,
    fichaSelecionadaId,
    nomeInimigo,
    hpMaxInput,
    mpMaxInput,
    tipoVilaoInput = 'padrao',
    acoesPorTurnoInput = 1,
    voadorInput = false,
    npcCatalogoSelecionado
  }) => {
    if (!isMestre) return false;
    const novaOrdem = participantes.length > 0 ? participantes[participantes.length - 1].ordem + 1 : 0;
    let novoCombatente = null;

    if (tipo === 'heroi') {
      const fichaEncontrada = fichasDisponiveis.find((f) => f.id === fichaSelecionadaId);
      if (!fichaEncontrada) {
        setAlerta({ isOpen: true, type: 'warning', title: 'Atenção', message: 'Selecione uma ficha válida.' });
        return false;
      }
      if (participantes.some((p) => p.nome.toLowerCase() === fichaEncontrada.nome_personagem.toLowerCase())) {
        setAlerta({ isOpen: true, type: 'warning', title: 'Herói Duplicado', message: `O herói "${fichaEncontrada.nome_personagem}" já está na cena!` });
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
    } else if (npcCatalogoSelecionado && (!nomeInimigo || nomeInimigo.trim() === '')) {
      const tipoVilaoNpc = npcCatalogoSelecionado.tipo_vilao || (
        npcCatalogoSelecionado.rank === 'campeao'
          ? 'campeao'
          : npcCatalogoSelecionado.rank === 'elite'
            ? 'elite'
            : 'padrao'
      );
      const fasesNpc = Array.isArray(npcCatalogoSelecionado.fases_chefao) ? npcCatalogoSelecionado.fases_chefao : [];
      const faseInicialNum = Math.max(1, Number(npcCatalogoSelecionado.fase_atual) || 1);
      const faseObj = fasesNpc.find((f, idx) => (Number(f.numero) || idx + 1) === faseInicialNum) || fasesNpc[0] || null;
      const acoesCalculadas = Number(faseObj?.acoes_por_turno) || Number(npcCatalogoSelecionado.acoes_por_turno) || calcularAcoesPorTurnoNpc({
        rank: npcCatalogoSelecionado.rank,
        tipoVilao: tipoVilaoNpc,
        quantidadeSoldados: npcCatalogoSelecionado.quantidade_soldados
      });
      const ehVoador = Boolean(
        npcCatalogoSelecionado.voador ||
        (npcCatalogoSelecionado.poderes || []).some((p) => String(p?.nome || p).toLowerCase().includes('voador')) ||
        String(npcCatalogoSelecionado.regras_especiais || npcCatalogoSelecionado.descricao || '').toLowerCase().includes('voador')
      );

      novoCombatente = construirCombatente({
        tipo: 'inimigo',
        nome: npcCatalogoSelecionado.nome,
        ordem: novaOrdem,
        hpMax: Number(faseObj?.pv_max) || npcCatalogoSelecionado.pv_max || 30,
        mpMax: Number(faseObj?.pm_max) || npcCatalogoSelecionado.pm_max || 20,
        tipoVilao: tipoVilaoNpc,
        pontosVilao: npcCatalogoSelecionado.pontos_vilao,
        fasesChefao: fasesNpc,
        acoesPorTurno: acoesCalculadas,
        faseAtual: faseInicialNum,
        npcId: npcCatalogoSelecionado.id,
        voador: ehVoador
      });
    } else {
      if (!nomeInimigo || !nomeInimigo.trim()) {
        setAlerta({ isOpen: true, type: 'warning', title: 'Campo Vazio', message: 'Digite o nome do inimigo.' });
        return false;
      }
      novoCombatente = construirCombatente({
        tipo: 'inimigo',
        nome: nomeInimigo.trim(),
        ordem: novaOrdem,
        hpMax: Number(hpMaxInput),
        mpMax: Number(mpMaxInput),
        tipoVilao: tipoVilaoInput,
        acoesPorTurno: Number(acoesPorTurnoInput) || 1,
        voador: Boolean(voadorInput)
      });
    }

    const { data, error } = await combatService.addParticipante(novoCombatente);
    if (!error && data && data.length > 0) {
      setParticipantes((prev) => [...prev, data[0]]);
      return true;
    }
    return false;
  }, [isMestre, participantes, fichasDisponiveis]);

  const iniciarExclusao = useCallback((p) => {
    if (!isMestre) return;
    coldDelete({
      item: p,
      message: `${p.nome} foi removido da cena.`,
      onRemove: (it) => setParticipantes((prev) => prev.filter((item) => item.id !== it.id)),
      onCommit: async (it) => { await combatService.deleteParticipante(it.id); },
      onRollback: (it) => setParticipantes((prev) => [...prev, it].sort((a, b) => a.ordem - b.ordem)),
      duration: 6000
    });
  }, [isMestre, coldDelete]);

  const salvarEdicao = useCallback(async (id) => {
    const participanteAtual = participantes.find((p) => p.id === id);
    const isNpc = isNpcCombatente(participanteAtual);

    const novoHpMax = Number(editForm.hp_max);
    const novoMpMax = Number(editForm.mp_max);

    const payload = {
      nome: editForm.nome,
      hp_max: novoHpMax,
      mp_max: novoMpMax,
      ip: Number(editForm.ip),
      pontos_fabula: Number(editForm.pontos_fabula)
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
        hp_max: novoHpMax,
        mp_max: novoMpMax,
        pi_max: Number(editForm.ip),
        fabula: Number(editForm.pontos_fabula)
      });
    }
  }, [editForm, participantes]);

  const cancelarEdicao = useCallback(() => setEditandoId(null), []);

  const alterarRecurso = useCallback(async (id, campo, valorAtual, delta, maximo = null) => {
    const participanteAtual = participantes.find((p) => p.id === id);
    const ehMeuPersonagem = !isMestre && participanteAtual && (
      (jogadorFichaId && String(participanteAtual.ficha_id) === jogadorFichaId) ||
      (jogadorNome && participanteAtual.nome?.trim().toLowerCase() === jogadorNome?.trim().toLowerCase())
    );
    if (!isMestre && !ehMeuPersonagem) return;
    const isNpc = isNpcCombatente(participanteAtual);

    let novoValor;
    const updates = {};

    if (isNpc && (campo === 'hp_atual' || campo === 'mp_atual')) {
      const maximoEfetivo = campo === 'hp_atual'
        ? (maximo !== null && maximo !== undefined ? Number(maximo) : extrairHpMax(participanteAtual))
        : (maximo !== null && maximo !== undefined ? Number(maximo) : extrairMpMax(participanteAtual));

      novoValor = clampRecursoNpc((Number(valorAtual) || 0) + (Number(delta) || 0), maximoEfetivo, 0);
      updates[campo] = novoValor;
      if (campo === 'hp_atual') {
        updates.dano_acumulado = calcularDanoAcumulado(novoValor, maximoEfetivo);
        const checkFase = verificarGatilhoTransicaoFase({
          hpAtual: novoValor,
          hpMax: maximoEfetivo,
          faseAtual: participanteAtual.fase_atual || 1,
          fasesChefao: participanteAtual.fases_chefao || []
        });
        if (checkFase.gatilhoAtivo && checkFase.proximaFaseObj && Number(valorAtual) > 0 && novoValor === 0) {
          setAlerta({
            isOpen: true,
            type: 'warning',
            title: `⚡ Gatilho de Fase — ${participanteAtual.nome}`,
            message: checkFase.motivo
          });
        }
      }
    } else if (campo === 'pontos_vilao') {
      novoValor = aplicarDeltaRecurso(valorAtual, delta, maximo, 0);
      updates.pontos_vilao = novoValor;
      updates.pontos_ultima = novoValor;
    } else {
      novoValor = aplicarDeltaRecurso(valorAtual, delta, maximo, 0);
      updates[campo] = novoValor;
    }

    setParticipantes((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    await combatService.updateParticipante(id, updates);

    if (participanteAtual && participanteAtual.tipo === 'heroi' && participanteAtual.ficha_id) {
      await combatService.updateRecursoFicha(participanteAtual.ficha_id, campo, novoValor);
    } else if (isNpc && participanteAtual?.modificadores?.npc_id) {
      await combatService.updateNpcMestreFromCombat(participanteAtual.modificadores.npc_id, updates);
    }
  }, [isMestre, participantes, jogadorFichaId, jogadorNome]);

  const gastarPontoVilaoCombate = useCallback(async (id, codigoAcao = 'INVOCAR_TRACO') => {
    if (!isMestre) return false;
    const participanteAtual = participantes.find((p) => p.id === id);
    if (!participanteAtual) return false;

    const resultado = consumirPontoVilaoNpc(participanteAtual, { codigoAcao });
    if (!resultado.valido) {
      setAlerta({ isOpen: true, type: 'warning', title: 'Pontos de Vilão Insuficientes', message: resultado.erro });
      return false;
    }

    const { entidadeAtualizada, acaoInfo, resumo } = resultado;
    const updates = {
      pontos_vilao: entidadeAtualizada.pontos_vilao,
      pontos_ultima: entidadeAtualizada.pontos_ultima,
      mp_atual: entidadeAtualizada.mp_atual,
      condicoes: entidadeAtualizada.condicoes
    };

    setParticipantes((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    await combatService.updateParticipante(id, updates);

    if (participanteAtual.modificadores?.npc_id) {
      await combatService.updateNpcMestreFromCombat(participanteAtual.modificadores.npc_id, updates);
    }

    const { data } = await combatService.registrarAcaoCombate({
      combatente_id: id,
      autor_nome: participanteAtual.nome,
      autor_tipo: 'inimigo',
      acao_codigo: `VILAO_${codigoAcao}`,
      acao_titulo: `💀 ${acaoInfo.titulo}`,
      detalhes: resumo,
      metadata: {
        pontos_vilao_restantes: updates.pontos_vilao,
        custo: resultado.custoAplicado
      }
    });
    if (data) {
      setAcoesFeed((prev) => [data, ...prev].slice(0, 30));
    }

    return true;
  }, [isMestre, participantes]);

  const transicionarFaseChefeCombate = useCallback(async (id, numeroFaseDestino = null) => {
    if (!isMestre) return false;
    const participanteAtual = participantes.find((p) => p.id === id);
    if (!participanteAtual) return false;

    const resultado = executarTransicaoFaseChefao(participanteAtual, numeroFaseDestino);
    if (!resultado.valido) {
      setAlerta({ isOpen: true, type: 'warning', title: 'Transição de Fase', message: resultado.erro });
      return false;
    }

    const { entidadeAtualizada, faseAtivada, resumo } = resultado;
    const updates = {
      fase_atual: entidadeAtualizada.fase_atual,
      acoes_por_turno: entidadeAtualizada.acoes_por_turno,
      hp_max: entidadeAtualizada.hp_max,
      hp_atual: entidadeAtualizada.hp_atual,
      mp_max: entidadeAtualizada.mp_max,
      mp_atual: entidadeAtualizada.mp_atual,
      dano_acumulado: 0,
      agiu: false,
      condicoes: entidadeAtualizada.condicoes,
      modificadores: entidadeAtualizada.modificadores
    };

    setParticipantes((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    await combatService.updateParticipante(id, updates);

    if (participanteAtual.modificadores?.npc_id) {
      await combatService.updateNpcMestreFromCombat(participanteAtual.modificadores.npc_id, updates);
    }

    const { data } = await combatService.registrarAcaoCombate({
      combatente_id: id,
      autor_nome: participanteAtual.nome,
      autor_tipo: 'inimigo',
      acao_codigo: 'TRANSICAO_FASE_CHEFE',
      acao_titulo: `🔥 ${faseAtivada.nome || `Fase ${entidadeAtualizada.fase_atual}`}`,
      detalhes: resumo,
      metadata: {
        fase_atual: entidadeAtualizada.fase_atual,
        hp_max: entidadeAtualizada.hp_max
      }
    });
    if (data) {
      setAcoesFeed((prev) => [data, ...prev].slice(0, 30));
    }

    setAlerta({
      isOpen: true,
      type: 'warning',
      title: `🔥 ${participanteAtual.nome} — ${faseAtivada.nome || `Fase ${entidadeAtualizada.fase_atual}`}`,
      message: resumo
    });

    return true;
  }, [isMestre, participantes]);

  const ajustarAcaoTurnoVilao = useCallback(async (id, deltaRealizadas = 1, novoTotalAcoes = null) => {
    if (!isMestre) return;
    const participanteAtual = participantes.find((p) => p.id === id);
    if (!participanteAtual) return;

    const totalAcoes = novoTotalAcoes !== null && novoTotalAcoes !== undefined
      ? Math.max(1, Number(novoTotalAcoes) || 1)
      : Math.max(1, Number(participanteAtual.acoes_por_turno) || 1);

    const modsAtuais = participanteAtual.modificadores && typeof participanteAtual.modificadores === 'object'
      ? participanteAtual.modificadores
      : {};
    const realizadasAtuais = Math.max(0, Number(modsAtuais.acoes_realizadas_rodada) || 0);
    const novasRealizadas = Math.max(0, Math.min(totalAcoes, realizadasAtuais + (Number(deltaRealizadas) || 0)));
    const concluiuTodas = novasRealizadas >= totalAcoes;

    const updates = {
      acoes_por_turno: totalAcoes,
      agiu: concluiuTodas,
      turno_atual: concluiuTodas ? false : participanteAtual.turno_atual,
      modificadores: {
        ...modsAtuais,
        acoes_realizadas_rodada: novasRealizadas
      }
    };

    setParticipantes((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    await combatService.updateParticipante(id, updates);

    if (novoTotalAcoes !== null && participanteAtual.modificadores?.npc_id) {
      await combatService.updateNpcMestreFromCombat(participanteAtual.modificadores.npc_id, { acoes_por_turno: totalAcoes });
    }
  }, [isMestre, participantes]);

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
  }, [isMestre, jogadorFichaId, jogadorNome]);

  const moverItem = useCallback(async (index, direcao) => {
    if (!isMestre) return;
    const novaLista = reordenarParticipantes(participantes, index, direcao);
    setParticipantes(novaLista);
    await combatService.salvarNovaOrdem(novaLista);
  }, [isMestre, participantes]);

  const obterPerfilRolagem = useCallback((combatente) => {
    if (!combatente) return null;
    const fichaCorrespondente = combatente.tipo === 'heroi'
      ? fichasDisponiveis.find(
          (f) =>
            String(f.id) === String(combatente.ficha_id) ||
            f.nome_personagem?.toLowerCase() === combatente.nome?.toLowerCase()
        )
      : null;

    const npcIdVinculado = combatente.modificadores?.npc_id;
    const npcCorrespondente = combatente.tipo !== 'heroi'
      ? npcsDisponiveis.find(
          (n) =>
            (npcIdVinculado && String(n.id) === String(npcIdVinculado)) ||
            n.nome?.toLowerCase() === combatente.nome?.toLowerCase()
        )
      : null;

    return extrairPerfilRolagemCombatente({
      combatente,
      ficha: fichaCorrespondente || null,
      npc: npcCorrespondente || null,
      modificadoresCena: estadoCombate?.modificadores_globais || {}
    });
  }, [fichasDisponiveis, npcsDisponiveis, estadoCombate?.modificadores_globais]);

  const rolarDadosNoCombate = useCallback(async (opcoes = {}) => {
    const {
      combatente,
      exibirPopup = true,
      ...restoOpcoes
    } = opcoes;

    const combatenteAlvo = combatente || participantes.find((p) => String(p.id) === String(opcoes.combatenteId));
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

    if (exibirPopup) {
      const tipoAlerta = resultado.isCritico ? 'success' : resultado.isFumble ? 'error' : 'info';
      setAlerta({
        isOpen: true,
        type: tipoAlerta,
        title: `🎲 ${resultado.autorNome} — ${resultado.titulo}`,
        message: resultado.detalhes
      });
    }

    return resultado;
  }, [participantes, obterPerfilRolagem, isMestre, jogadorFichaId, jogadorNome]);

  const fecharAlerta = useCallback(() => setAlerta((prev) => ({ ...prev, isOpen: false })), []);

  return {
    participantes,
    fichasDisponiveis,
    npcsDisponiveis,
    estadoCombate,
    relogios,
    acoesFeed,
    isLoading,
    alerta,
    fecharAlerta,
    jogadorFichaId,
    jogadorNome,
    sessaoJogador,
    recarregarFichas,
    editandoId,
    editForm,
    setEditForm,
    toggleTurno,
    ativarTurnoParticipante,
    resetRodada,
    restaurarTudoCena,
    atualizarModificadorGlobal,
    executarAcaoRapida,
    limparHistoricoAcoes,
    addParticipante,
    iniciarExclusao,
    salvarEdicao,
    cancelarEdicao,
    alterarRecurso,
    gastarPontoVilaoCombate,
    transicionarFaseChefeCombate,
    ajustarAcaoTurnoVilao,
    toggleCondicao,
    moverItem,
    obterPerfilRolagem,
    rolarDadosNoCombate
  };
}
