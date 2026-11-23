import { useState, useEffect, useCallback, useMemo } from 'react';
import { combatService } from '../../services/combatService';
import { fichaService } from '../../services/fichaService';
import { playerSessionService } from '../../services/playerSessionService';

/**
 * useCombatRealtimeState
 * Gerencia o estado central e a sincronização em tempo real do combate via Supabase Realtime.
 */
export function useCombatRealtimeState() {
  const [participantes, setParticipantes] = useState([]);
  const [fichasDisponiveis, setFichasDisponiveis] = useState([]);
  const [npcsDisponiveis, setNpcsDisponiveis] = useState([]);
  const [catalogoModulos, setCatalogoModulos] = useState([]);
  const [estadoCombate, setEstadoCombate] = useState({
    id: 1,
    rodada: 1,
    em_combate: true,
    modificadores_globais: {}
  });
  const [relogios, setRelogios] = useState([]);
  const [acoesFeed, setAcoesFeed] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alerta, setAlerta] = useState({ isOpen: false, title: '', message: '', type: 'alert' });

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
        const [fichasRes, npcsRes, iniciativaRes, estadoRes, relogiosRes, acoesRes, modulosData] = await Promise.all([
          combatService.getFichasPersonagens(),
          combatService.getNpcsCombate(),
          combatService.getParticipantes(),
          combatService.getEstadoCombate(),
          combatService.getRelogiosCombate(),
          combatService.getAcoesCombate(30),
          fichaService.getCatalogoVeiculosModulos().catch(() => [])
        ]);

        if (!ativo) return;
        if (fichasRes.data) setFichasDisponiveis(fichasRes.data);
        if (npcsRes.data) setNpcsDisponiveis(npcsRes.data);
        if (Array.isArray(modulosData)) setCatalogoModulos(modulosData);
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
              return {
                ...p,
                hp_atual: payload.new.hp_atual !== undefined ? Number(payload.new.hp_atual) : p.hp_atual,
                hp_max: payload.new.hp_max !== undefined ? Number(payload.new.hp_max) : p.hp_max,
                mp_atual: payload.new.mp_atual !== undefined ? Number(payload.new.mp_atual) : p.mp_atual,
                mp_max: payload.new.mp_max !== undefined ? Number(payload.new.mp_max) : p.mp_max,
                ip: payload.new.pi_max !== undefined ? Number(payload.new.pi_max) : p.ip,
                pontos_fabula: payload.new.fabula !== undefined ? Number(payload.new.fabula) : p.pontos_fabula,
                condicoes: Array.isArray(payload.new.condicoes) ? payload.new.condicoes : p.condicoes
              };
            }
            return p;
          })
        );
      }
    });

    return () => {
      ativo = false;
      if (subIniciativa?.unsubscribe) subIniciativa.unsubscribe();
      if (subEstado?.unsubscribe) subEstado.unsubscribe();
      if (subAcoes?.unsubscribe) subAcoes.unsubscribe();
      if (subFichas?.unsubscribe) subFichas.unsubscribe();
    };
  }, [recarregarParticipantes, recarregarFichas, recarregarRelogios, recarregarAcoes]);

  const fecharAlerta = useCallback(() => setAlerta((prev) => ({ ...prev, isOpen: false })), []);

  return {
    participantes,
    setParticipantes,
    fichasDisponiveis,
    npcsDisponiveis,
    setNpcsDisponiveis,
    catalogoModulos,
    estadoCombate,
    setEstadoCombate,
    relogios,
    setRelogios,
    acoesFeed,
    setAcoesFeed,
    isLoading,
    alerta,
    setAlerta,
    fecharAlerta,
    sessaoJogador,
    jogadorFichaId,
    jogadorNome,
    recarregarFichas,
    recarregarParticipantes
  };
}
